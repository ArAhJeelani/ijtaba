# Ijabah du’a research pilot

The five records in [pilot.json](pilot.json) are a manually checked pilot. Each includes the Arabic narration and its selected excerpt, reference, context, verification date, topics and a draft original English rendering. The Arabic transcription omits web formatting marks and uses visible quotation delimiters. Compare the excerpt and its surrounding words with the linked source before approval.

| Candidate | Topics | Source |
| --- | --- | --- |
| Sayyid al-Istighfar | Forgiveness, Gratitude | [Sahih al-Bukhari 6306](https://sunnah.com/bukhari:6306) |
| Refuge from worry and grief | Anxiety and hardship, Protection | [Sahih al-Bukhari 6369](https://sunnah.com/bukhari:6369) |
| For faith, worldly life and the Hereafter | This life and the Hereafter, Wellbeing | [Sahih Muslim 2720](https://sunnah.com/muslim:2720) |
| For guidance and piety | Guidance, Wellbeing | [Sahih Muslim 2721a](https://sunnah.com/muslim:2721a) |
| Refuge from knowledge that brings no benefit | Knowledge, Protection | [Sahih Muslim 2722](https://sunnah.com/muslim:2722) |

## How the pieces fit

1. **Research and retrieve.** Look up a narration on Sunnah.com and record the Arabic, ID, URL and verification date in a local import file. Start with Bukhari and Muslim. For Riyad as-Salihin, supply a direct underlying Bukhari or Muslim link and check that it supports the wording and attribution. The MVP has no network fetcher. Sunnah.com requires an API key and any future integration needs confirmed reuse permissions. [Sunnah.com developer information](https://sunnah.com/developers)
2. **Extract and validate.** `records.py` uses Pydantic, a Python validation library, to check the structure. It looks for the editor’s proposed excerpt as one exact span in the narration, so accent marks and punctuation inside that span survive unchanged. It checks URL and ID consistency. It cannot decide whether a valid-looking reference or editor’s interpretation is accurate. A human checks the actual source, the context, the English wording and reuse rights.
3. **Categorize and compare.** The editor selects one or more topics from a fixed list. The first topic is the card label, and all topics are searchable. Comparison ignores diacritics and punctuation solely to flag similar wording. The original narrations and their IDs stay separate.
4. **Review.** `staging.py` stores records and decision history in SQLite, a single local database file. The terminal dashboard in `manage.py` shows the evidence and accepts Approve, Reject and Request Correction. It runs under a trusted reviewer’s OS account. Keep the database and checkout writable only by authorized operators, and use `--db` before the subcommand to point to a private nonsynced location if needed. There is no public review route.
5. **Publish.** `publisher.py` revalidates approved records and matches each approval to the exact reviewed payload before atomically replacing `src/data/approvedDuas.ts`. The app includes this generated catalog in Discover, My Du’as and calendar scheduling through the existing library. The publisher reads only the staging database. Personal du’as and schedules live in browser storage.

The pilot records cite collection membership as evidence of provenance. Their individual grade and grading authority fields are blank because no separate grade is claimed. If a named grading source reports a dispute, preserve that flag and explain it for the reviewer. Treat English renderings as drafts until a human checks them. An imported translation from another source requires attribution and a defensible reuse basis.

This workflow uses ordinary Python, SQLite and manual source review. It requires neither an AI model nor an API key. Because there is no API integration, the source-failure tests exercise missing imports and transaction rollback.

## Run from the `ijabah` directory

```powershell
python -m venv research/.venv
research/.venv/Scripts/python.exe -m pip install -r research/requirements.txt
research/.venv/Scripts/python.exe research/manage.py import research/pilot.json
research/.venv/Scripts/python.exe research/manage.py list
research/.venv/Scripts/python.exe research/manage.py show hadith-muslim-2721a
research/.venv/Scripts/python.exe research/manage.py dashboard
research/.venv/Scripts/python.exe -m unittest discover -s research -v
```

On macOS or Linux, use `research/.venv/bin/python` in place of the Windows interpreter path. On terminals that require it for Arabic display, enable Python UTF-8 mode with `-X utf8` before the script name.

Importing the same file twice should show five added on the first run and five unchanged on the second. Use the dashboard to view each record and record a decision. To revise a candidate, request correction, edit a copy of the record, then run `python research/manage.py import corrected.json --correction`. The corrected version requires a new approval. An approval includes a reviewer name, a note and confirmation that the source, excerpt, context, grade and reuse rights were checked.

After real approval, run `python research/manage.py publish` using the environment above. Run the normal frontend dev or build command. Confirm an approved entry appears in Discover, matches both assigned categories, links to its original hadith and can be saved and scheduled. A published build contains the exported entries, so rebuild and redeploy after adding or withdrawing approval. The tests exercise all five through an isolated export using fixture decisions. The supplied catalog starts empty and the real review queue remains pending.
