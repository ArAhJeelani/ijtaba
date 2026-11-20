import json
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from publisher import publish
from records import SourceRecord
from staging import details, import_file, queue, review, transaction

PILOT = Path(__file__).with_name("pilot.json")


class PipelineTests(unittest.TestCase):
    def setUp(self):
        workspace = TemporaryDirectory()
        self.addCleanup(workspace.cleanup)
        self.root = Path(workspace.name)
        self.db = self.root / "staging.sqlite3"
        self.export = self.root / "approvedDuas.ts"
        self.rows = json.loads(PILOT.read_text(encoding="utf-8"))

    def file(self, rows):
        path = self.root / "input.json"
        path.write_text(json.dumps(rows, ensure_ascii=False), encoding="utf-8")
        return path

    def test_invalid_source_records_are_rejected(self):
        for changes in ({"reference": ""}, {"source_url": "https://sunnah.com/muslim:2722"},
                        {"excerpt": "اللهم"}, {"translation_rights": None}):
            with self.subTest(changes=changes), self.assertRaises(ValueError):
                with transaction(self.db) as db:
                    import_file(db, self.file([dict(self.rows[0], **changes)]))

    def test_duplicate_ids_and_restarts(self):
        with transaction(self.db) as db:
            self.assertEqual(import_file(db, PILOT)["added"], 5)
        with transaction(self.db) as db:
            self.assertEqual(import_file(db, PILOT)["unchanged"], 5)
            with self.assertRaisesRegex(ValueError, "duplicate source IDs"):
                import_file(db, self.file([self.rows[0], self.rows[0]]))
            self.assertEqual(len(queue(db)), 5)

    def test_source_failure_leaves_existing_records_untouched(self):
        with transaction(self.db) as db:
            import_file(db, self.file(self.rows[:1]))
        with self.assertRaisesRegex(ValueError, "already exists"):
            with transaction(self.db) as db:
                import_file(db, self.file([self.rows[1], dict(self.rows[0], title="Changed")]))
        with self.assertRaises(FileNotFoundError):
            with transaction(self.db) as db:
                import_file(db, self.root / "missing.json")
        with transaction(self.db) as db:
            self.assertEqual([(r.title, s) for r, s in queue(db)],
                             [(self.rows[0]["title"], "pending")])

    def test_five_records_round_trip_with_approval_and_exact_arabic(self):
        with transaction(self.db) as db:
            import_file(db, PILOT)
            self.assertEqual(publish(db, self.export), 0)
            for record, _ in queue(db):
                review(db, record.id, "approve", "Fixture reviewer", "Test decision")
                self.assertEqual(details(db, record.id)["history"][0]["action"], "approve")
            self.assertEqual(publish(db, self.export), 5)
        generated = self.export.read_text(encoding="utf-8").split("Dua[] = ", 1)[1]
        entries = json.loads(generated.removesuffix(";\n"))
        self.assertEqual([entry["arabic"] for entry in entries],
                         [row["excerpt"] for row in self.rows])
        for entry in entries:
            self.assertNotIn("source_arabic", entry)
            self.assertNotIn("history", entry)

    def test_correction_requires_a_fresh_review(self):
        candidate = SourceRecord.model_validate(self.rows[0])
        with transaction(self.db) as db:
            import_file(db, self.file([self.rows[0]]))
            review(db, candidate.id, "approve", "Reviewer", "Checked")
            review(db, candidate.id, "request-correction", "Reviewer", "Revise the title")
            self.assertEqual(publish(db, self.export), 0)
            with self.assertRaises(ValueError):
                review(db, candidate.id, "approve", "Reviewer", "Unchecked")
            corrected = dict(self.rows[0], title="Seeking forgiveness")
            self.assertEqual(import_file(db, self.file([corrected]), correction=True)["corrected"], 1)
            self.assertEqual(publish(db, self.export), 0)
            review(db, candidate.id, "reject", "Reviewer", "Needs more evidence")
            self.assertEqual(publish(db, self.export), 0)
            self.assertEqual([event["action"] for event in details(db, candidate.id)["history"]],
                             ["approve", "request-correction", "reject"])

    def test_invalid_approved_payload_cannot_replace_catalog(self):
        record = SourceRecord.model_validate(self.rows[0])
        self.export.write_text("previous catalog", encoding="utf-8")
        with self.assertRaises(ValueError):
            with transaction(self.db) as db:
                import_file(db, self.file([self.rows[0]]))
                db.execute("UPDATE candidates SET payload = ?", ("{}",))
                db.execute("UPDATE candidates SET status = 'approved'")
                db.execute("INSERT INTO history VALUES (1, ?, 'approve', 'test', 'test', 'test', '{}')",
                           (record.id,))
                publish(db, self.export)
        self.assertEqual(self.export.read_text(encoding="utf-8"), "previous catalog")

    def test_variant_warnings_preserve_separate_narrations(self):
        original = self.rows[0]
        other = dict(original, reference="6306a", source_url="https://sunnah.com/bukhari:6306a")
        with transaction(self.db) as db:
            import_file(db, self.file([original, other]))
            detail = details(db, "hadith-bukhari-6306")
            self.assertEqual(detail["possible_duplicates"],
                             [{"id": "hadith-bukhari-6306a", "match": "same normalized wording"}])
            self.assertEqual(len(queue(db)), 2)


if __name__ == "__main__":
    unittest.main()
