"""Store source records and human decisions in a local SQLite queue."""
from contextlib import closing, contextmanager
from datetime import datetime, timezone
import json
import sqlite3

from pydantic import TypeAdapter
from records import COLLECTIONS, SourceRecord, possible_variants


@contextmanager
def transaction(path):
    with closing(sqlite3.connect(path)) as db, db:
        db.row_factory = sqlite3.Row
        db.execute("BEGIN IMMEDIATE")
        db.execute("""CREATE TABLE IF NOT EXISTS candidates (
            id TEXT PRIMARY KEY, payload TEXT NOT NULL,
            status TEXT NOT NULL CHECK(status IN ('pending','needs_review','approved','rejected'))
        )""")
        db.execute("""CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY, candidate_id TEXT NOT NULL, action TEXT NOT NULL,
            reviewer TEXT NOT NULL, note TEXT NOT NULL, occurred_at TEXT NOT NULL,
            payload TEXT NOT NULL
        )""")
        yield db


def import_file(db, path, *, correction=False):
    records = TypeAdapter(list[SourceRecord]).validate_json(path.read_bytes())
    if len(records) != len({record.id for record in records}):
        raise ValueError("The import contains duplicate source IDs.")
    added = unchanged = corrected = 0
    for record in records:
        payload = record.model_dump_json()
        existing = db.execute("SELECT * FROM candidates WHERE id = ?", (record.id,)).fetchone()
        status = "needs_review" if record.uncertainties else "pending"
        if existing is None:
            if correction:
                raise ValueError(f"{record.id} is not in the review queue.")
            db.execute("INSERT INTO candidates VALUES (?, ?, ?)", (record.id, payload, status))
            added += 1
        elif existing["payload"] == payload:
            unchanged += 1
        elif correction and existing["status"] == "needs_review":
            db.execute("UPDATE candidates SET payload = ?, status = ? WHERE id = ?",
                       (payload, status, record.id))
            corrected += 1
        else:
            raise ValueError(f"{record.id} already exists with different data. Request correction first.")
    return {"added": added, "unchanged": unchanged, "corrected": corrected}


def queue(db):
    return [(SourceRecord.model_validate_json(row["payload"]), row["status"])
            for row in db.execute("SELECT * FROM candidates ORDER BY id")]


def details(db, candidate_id):
    records = queue(db)
    for record, status in records:
        if record.id == candidate_id:
            history = db.execute("""SELECT action, reviewer, note, occurred_at FROM history
                                  WHERE candidate_id = ? ORDER BY id""", (candidate_id,))
            return {**record.model_dump(mode="json"), "id": record.id, "arabic": record.arabic,
                    "collection_name": COLLECTIONS[record.collection], "source_type": "hadith",
                    "status": status,
                    "possible_duplicates": possible_variants(record, (item for item, _ in records)),
                    "history": [dict(event) for event in history]}
    raise ValueError(f"Unknown candidate {candidate_id}.")


def review(db, candidate_id, action, reviewer, note):
    if not reviewer.strip() or not note.strip():
        raise ValueError("A reviewer name and a decision note are required.")
    row = db.execute("SELECT * FROM candidates WHERE id = ?", (candidate_id,)).fetchone()
    if row is None:
        raise ValueError(f"Unknown candidate {candidate_id}.")
    status = {"approve": "approved", "reject": "rejected", "request-correction": "needs_review"}[action]
    if status == row["status"]:
        raise ValueError(f"{candidate_id} already has status {status}.")
    if action == "approve":
        record = SourceRecord.model_validate_json(row["payload"])
        if record.uncertainties or row["status"] != "pending":
            raise ValueError("Resolve review flags and import a correction before approval.")
    db.execute("UPDATE candidates SET status = ? WHERE id = ?", (status, candidate_id))
    db.execute("""INSERT INTO history (candidate_id, action, reviewer, note, occurred_at, payload)
                  VALUES (?, ?, ?, ?, ?, ?)""",
               (candidate_id, action, reviewer, note, datetime.now(timezone.utc).isoformat(),
                row["payload"]))
