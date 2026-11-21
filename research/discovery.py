"""Bounded, fixture-backed discovery for the private du'a review queue."""
from contextlib import closing
from datetime import datetime, timezone
from itertools import islice
import json
from pathlib import Path
import re
import sqlite3
from time import monotonic, sleep
from typing import Iterable, Protocol

from pydantic import ValidationError

from records import DiscoveryCandidate, Narration, normalized_arabic, possible_variants
from staging import queue, stage_discovery, transaction

PILOT = Path(__file__).with_name("pilot.json")
SOURCE_FIELDS = ("collection", "reference", "source_url", "source_arabic")


class SourceFailure(Exception):
    """Provider errors should use a short, credential-free message."""

    def __init__(self, message: str, *, retry_after: float | None = None):
        super().__init__(message)
        self.retry_after = retry_after


class SourceProvider(Protocol):
    name: str
    min_interval: float

    def discover(self, offset: int, limit: int) -> list[str]: ...

    def retrieve(self, key: str) -> Narration: ...


class FixtureProvider:
    """Project the source fields from the checked-in local pilot."""

    name = "local-fixture"
    min_interval = 0.0

    def __init__(self, path=PILOT):
        self.path = path
        self.rows = []

    def discover(self, offset: int, limit: int) -> list[str]:
        try:
            self.rows = json.loads(self.path.read_text(encoding="utf-8"))
            if not isinstance(self.rows, list):
                raise ValueError("Expected a list.")
        except (OSError, ValueError) as error:
            raise SourceFailure("The local narration fixture is unavailable or invalid.") from error
        return [str(index) for index in range(offset, min(offset + limit, len(self.rows)))]

    def retrieve(self, key: str) -> Narration:
        row = self.rows[int(key)]
        if not isinstance(row, dict):
            raise SourceFailure("The fixture entry must be an object.")
        return Narration.model_validate({field: row.get(field) for field in SOURCE_FIELDS})


class Extractor(Protocol):
    def __call__(
        self, narration: Narration, provider: str, retrieved_at: datetime,
    ) -> DiscoveryCandidate | None: ...


def extract(narration: Narration, provider: str, retrieved_at: datetime):
    # Search the normalized letters only to recognize an invocation. Slice the
    # original string for the excerpt, including its marks and punctuation.
    arabic = narration.source_arabic
    if "اللهم" not in normalized_arabic(arabic):
        return None
    spans = []
    for quote in re.finditer(r"«([^»]+)»", arabic):
        invocation = re.search(r"ا[\u064b-\u065f]*ل[\u064b-\u065f]*ل[\u064b-\u065f]*ه[\u064b-\u065f]*م", quote[1])
        if invocation:
            spans.append(quote[1][invocation.start():].strip())
    excerpt = spans[0] if len(spans) == 1 else None
    wording = normalized_arabic(excerpt or "")
    topics = [
        ("اغفر", "Forgiveness", "forgiveness"),
        ("اعوذبك", "Protection", "refuge"),
        ("الهدى", "Guidance", "guidance"),
        ("اخرتي", "This life and the Hereafter", "the Hereafter"),
    ]
    found = [(category, subject) for cue, category, subject in topics if cue in wording]
    categories = [category for category, _ in found]
    subject = " and ".join(subject for _, subject in found)
    return DiscoveryCandidate(
        **narration.model_dump(),
        retrieved_at=retrieved_at,
        source_provider=provider,
        extraction_method="quoted-invocation-v1",
        title=f"Supplication concerning {subject}" if subject else "Possible supplication",
        excerpt=excerpt,
        categories=categories,
        context="A possible invocation within the quoted speech of the narration.",
        unverified_english_explanation=(
            f"The invocation appears to concern {subject}."
            if subject else "The narration appears to contain an address to Allah."
        ),
        uncertainties=[
            "Confirm the source wording, speaker, context, suggested topics, and reuse rights.",
            "The English explanation comes from keyword cues and needs human review.",
        ],
    )


class SourceRequests:
    def __init__(self, interval, wait=sleep, clock=monotonic):
        self.interval = interval
        self.wait = wait
        self.clock = clock
        self.next_request = 0.0

    def call(self, operation, *args):
        for attempt in range(3):
            delay = self.next_request - self.clock()
            if delay > 0:
                self.wait(delay)
            self.next_request = self.clock() + self.interval
            try:
                return operation(*args)
            except SourceFailure as error:
                delay = error.retry_after
                if attempt == 2 or delay is None or not 0 <= delay <= 30:
                    raise
                self.next_request = max(self.next_request, self.clock() + max(delay, 2 ** attempt))


def read_existing(path):
    if not path.exists():
        return []
    with closing(sqlite3.connect(f"{path.resolve().as_uri()}?mode=ro", uri=True)) as db:
        db.row_factory = sqlite3.Row
        table = db.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='candidates'")
        return queue(db) if table.fetchone() else []


def compare_and_stage(candidates: Iterable[DiscoveryCandidate], existing, report, db=None):
    prior = {record.id: record for record, _ in existing}
    for record in candidates:
        if record.id in prior:
            report["repeated"].append({
                "id": record.id,
                "source_changed": record.source_arabic != prior[record.id].source_arabic,
            })
            continue
        warnings = possible_variants(record, prior.values())
        if db is not None:
            stage_discovery(db, record)
        prior[record.id] = record
        report["candidates"].append({
            "id": record.id,
            "status": "needs_review" if record.needs_correction else "pending",
            "possible_duplicates": warnings,
        })


def run_batch(path, provider: SourceProvider, *, limit=5, offset=0, dry_run=False,
              extractor: Extractor = extract, requests=None, progress=print):
    if not 1 <= limit <= 100 or offset < 0:
        raise ValueError("Use a limit from 1 to 100 and an offset of zero or more.")
    requests = requests if requests is not None else SourceRequests(provider.min_interval)
    report = {
        "source": provider.name, "dry_run": dry_run, "offset": offset, "examined": 0,
        "candidates": [], "repeated": [], "unrelated": [], "errors": [],
    }
    progress(f"Discovering up to {limit} narrations from {provider.name}.")
    try:
        keys = requests.call(provider.discover, offset, limit)
    except SourceFailure as error:
        report["errors"].append({"step": "discover", "reason": str(error)})
        return report

    candidates = []
    for key in islice(keys, limit):
        report["examined"] += 1
        try:
            narration = requests.call(provider.retrieve, key)
            retrieved_at = datetime.now(timezone.utc)
        except (SourceFailure, ValidationError) as error:
            reason = str(error) if isinstance(error, SourceFailure) else invalid_fields(error)
            report["errors"].append({"step": "retrieve", "key": key, "reason": reason})
            if isinstance(error, SourceFailure) and error.retry_after is not None:
                break
            continue
        progress(f"Checking {narration.id}.")
        try:
            candidate = extractor(narration, provider.name, retrieved_at)
            if candidate is not None:
                candidate = DiscoveryCandidate.model_validate(candidate.model_dump())
                if any(getattr(candidate, field) != getattr(narration, field)
                       for field in SOURCE_FIELDS):
                    raise ValueError("Extraction changed the retrieved source fields.")
                if candidate.retrieved_at != retrieved_at or candidate.source_provider != provider.name:
                    raise ValueError("Extraction changed the retrieval metadata.")
        except (ValidationError, ValueError) as error:
            reason = invalid_fields(error) if isinstance(error, ValidationError) else str(error)
            report["errors"].append({"step": "extract", "id": narration.id, "reason": reason})
            continue
        if candidate is None:
            report["unrelated"].append(narration.id)
        else:
            candidates.append(candidate)

    if candidates and dry_run:
        compare_and_stage(candidates, read_existing(path), report)
    elif candidates:
        with transaction(path) as db:
            compare_and_stage(candidates, queue(db), report, db)
    return report


def invalid_fields(error):
    return "; ".join(
        f"{'.'.join(map(str, field['loc'])) or 'record'}: {field['msg']}"
        for field in error.errors(include_input=False, include_url=False)
    )
