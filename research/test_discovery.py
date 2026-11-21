import json
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from discovery import FixtureProvider, PILOT, SourceFailure, SourceRequests, extract, run_batch
from publisher import publish
from staging import details, import_file, queue, review, transaction


class DiscoveryTests(unittest.TestCase):
    def setUp(self):
        workspace = TemporaryDirectory()
        self.addCleanup(workspace.cleanup)
        self.root = Path(workspace.name)
        self.db = self.root / "research.sqlite3"
        self.rows = json.loads(PILOT.read_text(encoding="utf-8"))

    def run_discovery(self, provider=None, **options):
        return run_batch(self.db, provider or FixtureProvider(), progress=lambda _: None, **options)

    def fixture(self, rows):
        path = self.root / "fixture.json"
        path.write_text(json.dumps(rows, ensure_ascii=False), encoding="utf-8")
        return FixtureProvider(path)

    def test_limited_dry_run_and_exact_fixture_retrieval(self):
        report = self.run_discovery(limit=3, dry_run=True)
        self.assertEqual(report["examined"], 3)
        self.assertEqual(len(report["candidates"]), 3)
        self.assertFalse(self.db.exists())
        self.run_discovery(limit=3)
        with transaction(self.db) as db:
            record = details(db, "hadith-bukhari-6306")
            self.assertEqual(record["source_arabic"], self.rows[0]["source_arabic"])
            self.assertEqual(record["excerpt"], self.rows[0]["excerpt"])
            self.assertEqual(record["arabic"], self.rows[0]["excerpt"])
            self.assertEqual(record["source_provider"], "local-fixture")
            self.assertEqual(record["record_type"], "unverified_discovery")
            self.assertTrue(record["retrieved_at"].endswith("Z"))
            self.assertNotIn("verified_at", record)
        snapshot = self.db.read_bytes()
        report = self.run_discovery(limit=3, dry_run=True)
        self.assertEqual(len(report["repeated"]), 3)
        self.assertEqual(self.db.read_bytes(), snapshot)

    def test_unavailable_source_and_malformed_references_are_reported(self):
        report = self.run_discovery(FixtureProvider(self.root / "missing.json"))
        self.assertEqual(report["errors"][0]["step"], "discover")
        self.assertFalse(self.db.exists())
        wrong_url = dict(self.rows[0], source_url="https://sunnah.com/bukhari:6369")
        missing_ref = dict(self.rows[0])
        del missing_ref["reference"]
        unrelated = dict(self.rows[0], source_arabic="قال الراوي")
        report = self.run_discovery(self.fixture([wrong_url, missing_ref, unrelated, self.rows[1]]))
        self.assertEqual(len(report["errors"]), 2)
        self.assertIn("reference", report["errors"][1]["reason"])
        self.assertEqual(report["unrelated"], ["hadith-bukhari-6306"])
        self.assertEqual([item["id"] for item in report["candidates"]], ["hadith-bukhari-6369"])

    def test_invalid_excerpt_is_flagged_and_changed_references_are_rejected(self):
        def invalid_excerpt(*args):
            return extract(*args).model_copy(update={"excerpt": "اللهم"})

        def invented_reference(*args):
            return extract(*args).model_copy(update={
                "reference": "123", "source_url": "https://sunnah.com/bukhari:123",
            })

        self.run_discovery(limit=1, extractor=invalid_excerpt)
        report = self.run_discovery(limit=1, offset=1, extractor=invented_reference)
        self.assertEqual(report["errors"][0]["step"], "extract")
        with transaction(self.db) as db:
            self.assertEqual(len(queue(db)), 1)
            item = details(db, "hadith-bukhari-6306")
            self.assertEqual(item["status"], "needs_review")
            self.assertEqual(item["arabic"], "")
            self.assertTrue(any("exactly once" in warning for warning in item["uncertainties"]))

    def test_repeated_imports_and_variants_preserve_separate_references(self):
        original = self.rows[0]
        variant = dict(original, reference="6306a", source_url="https://sunnah.com/bukhari:6306a")
        provider = self.fixture([original, variant, original])
        report = self.run_discovery(provider)
        self.assertEqual(len(report["candidates"]), 2)
        self.assertEqual(report["candidates"][1]["possible_duplicates"][0]["id"], "hadith-bukhari-6306")
        self.assertEqual(len(report["repeated"]), 1)
        repeat = self.run_discovery(provider)
        self.assertEqual(len(repeat["repeated"]), 3)
        with transaction(self.db) as db:
            item = details(db, "hadith-bukhari-6306")
            self.assertEqual(len(item["history"]), 1)
            self.assertEqual(item["possible_duplicates"][0]["id"], "hadith-bukhari-6306a")

    def test_transient_retrieval_retries_are_bounded_and_rate_limited(self):
        class FlakyProvider(FixtureProvider):
            min_interval = 2
            calls = 0

            def retrieve(self, key):
                self.calls += 1
                if self.calls < 3:
                    raise SourceFailure("Temporarily unavailable.", retry_after=3)
                return super().retrieve(key)

        now = 0
        waits = []

        def wait(seconds):
            nonlocal now
            waits.append(seconds)
            now += seconds

        provider = FlakyProvider()
        requests = SourceRequests(provider.min_interval, wait, lambda: now)
        report = self.run_discovery(provider, limit=1, requests=requests)
        self.assertEqual(provider.calls, 3)
        self.assertEqual(waits, [2, 3, 3])
        self.assertEqual(len(report["candidates"]), 1)
        self.assertEqual(self.run_discovery(limit=1)["repeated"][0]["id"], "hadith-bukhari-6306")

    def test_rate_limit_can_defer_batch(self):
        class RateLimitedProvider(FixtureProvider):
            def retrieve(self, key):
                raise SourceFailure("Rate limited. Rerun later.", retry_after=60)

        report = self.run_discovery(RateLimitedProvider(), limit=5)
        self.assertEqual(report["examined"], 1)
        self.assertEqual(len(report["errors"]), 1)
        self.assertFalse(self.db.exists())

    def test_discovery_requires_manual_verification_then_explicit_approval(self):
        self.run_discovery(limit=3)
        candidate = "hadith-bukhari-6306"
        export = self.root / "test-export.ts"
        corrected = self.fixture(self.rows[:1]).path
        with transaction(self.db) as db:
            with self.assertRaisesRegex(ValueError, "manually verified"):
                review(db, candidate, "approve", "Test reviewer", "Test decision")
            self.assertEqual(publish(db, export), 0)
            review(db, candidate, "request-correction", "Test reviewer", "Check the source")
            review(db, "hadith-bukhari-6369", "reject", "Test reviewer", "Fixture rejection")
            self.assertEqual(import_file(db, corrected, correction=True)["corrected"], 1)
            self.assertEqual(publish(db, export), 0)
            review(db, candidate, "approve", "Test reviewer", "Checked exact wording")
            self.assertEqual(publish(db, export), 1)
            self.assertEqual([event["action"] for event in details(db, candidate)["history"]],
                             ["discovered", "request-correction", "approve"])
        self.assertIn(candidate, export.read_text(encoding="utf-8"))
