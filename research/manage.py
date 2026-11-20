"""Local terminal dashboard. The OS account and directory ACLs control access."""
import argparse
import json
import logging
from pathlib import Path
import sqlite3

from publisher import publish
from staging import details, import_file, queue, review, transaction

HERE = Path(__file__).resolve().parent
EXPORT = HERE.parent / "src" / "data" / "approvedDuas.ts"


def display(value):
    print(json.dumps(value, ensure_ascii=False, indent=2))


def dashboard(path):
    while True:
        with transaction(path) as db:
            records = queue(db)
            for number, (record, status) in enumerate(records, 1):
                print(f"{number}. [{status}] {record.id} · {record.title!r}")
        selection = input("Candidate number, or Enter to quit: ").strip()
        if not selection:
            return
        if not selection.isdecimal() or len(selection) > 8 or not 1 <= int(selection) <= len(records):
            print("Select a listed candidate.")
            continue
        candidate_id = records[int(selection) - 1][0].id
        with transaction(path) as db:
            reviewed = details(db, candidate_id)
            display(reviewed)
        action = input("approve / reject / request-correction / Enter to go back: ").strip()
        if action not in {"approve", "reject", "request-correction"}:
            continue
        if action == "approve" and input(
            "Confirm you checked the source, excerpt, context, grading and reuse rights (type yes): "
        ) != "yes":
            continue
        reviewer = input("Reviewer name: ")
        note = input("Decision note: ")
        try:
            with transaction(path) as db:
                current = details(db, candidate_id)
                if current != reviewed:
                    raise ValueError("The candidate or its review context changed. Open it again.")
                review(db, candidate_id, action, reviewer, note)
        except ValueError as error:
            logging.error("%s", error)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--db", type=Path, default=HERE / "staging.sqlite3")
    commands = parser.add_subparsers(dest="command", required=True)
    ingest = commands.add_parser("import")
    ingest.add_argument("file", type=Path)
    ingest.add_argument("--correction", action="store_true")
    show = commands.add_parser("show")
    show.add_argument("id")
    commands.add_parser("list")
    commands.add_parser("dashboard")
    commands.add_parser("publish")
    args = parser.parse_args()
    try:
        if args.command == "publish" and not args.db.is_file():
            raise ValueError("Import the source records before publishing.")
        if args.command == "dashboard":
            dashboard(args.db)
        else:
            with transaction(args.db) as db:
                if args.command == "import":
                    display(import_file(db, args.file, correction=args.correction))
                elif args.command == "show":
                    display(details(db, args.id))
                elif args.command == "list":
                    display([{"id": record.id, "title": record.title,
                              "reference": record.reference, "status": status}
                             for record, status in queue(db)])
                elif args.command == "publish":
                    print(f"Exported {publish(db, EXPORT)} approved entries.")
    except (ValueError, OSError, EOFError, sqlite3.Error) as error:
        logging.error("%s", error)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
