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

1. **Research and retrieve.** Run the offline discovery batch below or look up a narration on Sunnah.com and record the Arabic, ID, URL and verification date in a local import file after checking the source. Start with Bukhari and Muslim. For manual Riyad as-Salihin imports, supply a direct underlying Bukhari or Muslim link and check that it supports the wording and attribution.
2. **Extract and validate.** `records.py` uses Pydantic, a Python validation library, to check the structure. It looks for the editor’s proposed excerpt as one exact span in the narration, so accent marks and punctuation inside that span survive unchanged. It checks URL and ID consistency. It cannot decide whether a valid-looking reference or editor’s interpretation is accurate. A human checks the actual source, the context, the English wording and reuse rights.
3. **Categorize and compare.** The editor selects one or more topics from a fixed list. The first topic is the card label, and all topics are searchable. Comparison ignores diacritics and punctuation solely to flag similar wording. The original narrations and their IDs stay separate.
4. **Review.** `staging.py` stores records and decision history in SQLite, a single local database file. The terminal dashboard in `manage.py` shows the evidence and accepts Approve, Reject and Request Correction. It runs under a trusted reviewer’s OS account. Keep the database and checkout writable only by authorized operators, and use `--db` before the subcommand to point to a private nonsynced location if needed. There is no public review route.
5. **Publish.** `publisher.py` revalidates approved records and matches each approval to the exact reviewed payload before atomically replacing `src/data/approvedDuas.ts`. The app includes this generated catalog in Discover, My Du’as and calendar scheduling through the existing library. The publisher reads only the staging database. Personal du’as and schedules live in browser storage.

The pilot records cite collection membership as evidence of provenance. Their individual grade and grading authority fields are blank because no separate grade is claimed. If a named grading source reports a dispute, preserve that flag and explain it for the reviewer. Treat English renderings as drafts until a human checks them. An imported translation from another source requires attribution and a defensible reuse basis.

## Run the discovery agent

After installing the requirements using the commands below, run the following from the repository root. The demo database keeps the fixture exercise separate from the primary review queue, which may already contain these references.

```powershell
research/.venv/Scripts/python.exe -X utf8 research/manage.py --db research/demo.sqlite3 discover --limit 5 --dry-run
research/.venv/Scripts/python.exe -X utf8 research/manage.py --db research/demo.sqlite3 discover --limit 5
research/.venv/Scripts/python.exe -X utf8 research/manage.py --db research/demo.sqlite3 show hadith-bukhari-6306
research/.venv/Scripts/python.exe -X utf8 research/manage.py --db research/demo.sqlite3 dashboard
```

The fixture provider reads only the source fields of the checked-in Bukhari and Muslim pilot narrations. The extractor looks for a quoted Arabic invocation and copies a contiguous span exactly. It uses keyword cues for the title, topics, and a draft English explanation. The queue shows that explanation as unverified, along with the full source passage, selected excerpt, direct link, retrieval timestamp, extraction method and uncertainties. A missing or ambiguous exact excerpt is flagged for correction. Narrations without the invocation cue are skipped. This initial rule can miss supplications with different wording or quoting conventions.

The default batch examines up to five narrations. Use `--limit` to change the batch size and `--offset` to start later in the fixture. The report lists proposed or staged candidates, repeated references, unrelated results and errors. Repeated references are skipped and changed source wording is reported without overwriting the queued record. Similar Arabic across different references produces a warning, and both narrations remain visible. A dry run compares against the chosen database without creating or changing it. A source failure is reported with a nonzero exit status, and valid candidates retrieved before an error can still be staged.

In the dashboard, open the candidate, follow its source URL and compare the entire passage, exact excerpt, speaker, context and any duplicate warnings. Reject it or request correction with a reviewer name and note. To bring a candidate forward, request correction if its status is pending, then prepare a reviewed JSON array using the fields in `pilot.json` as a template. Keep the same collection and reference. Supply the actual date you verified the source, the exact confirmed excerpt, title, context and at least one confirmed category. If including an English translation, supply its attribution and reuse basis. Leave discovery-only fields out of the reviewed file. Import it using `manage.py --db research/demo.sqlite3 import reviewed.json --correction` and reopen the dashboard to record a separate approval. For real review, use the actual private database path in place of the demo path. Discovery candidates have no verification date, and the publisher accepts only the reviewed record with an explicit matching approval.

### Enable live discovery later

Request an API key and confirm the permitted storage, display and reuse of the Arabic and any English text with Sunnah.com. Implement a `SourceProvider` that uses the documented collection endpoints, maps provider references to canonical URLs, sets a request timeout and minimum interval, and reads the credential server-side from an environment variable such as `SUNNAH_API_KEY`. The current CLI runs only the fixture provider and makes no network calls. The batch runner supports bounded retries for provider-declared transient failures, honors the provider's configured request interval and defers a batch when a retry delay exceeds its wait budget. [Sunnah.com developer information](https://sunnah.com/developers)

An LLM can be added behind the `Extractor` interface to propose spans and draft metadata. Keep the retrieval fields fixed and validate the proposed span against the original Arabic before staging. The agent runs when invoked from the CLI. A future read-and-stage schedule can use the same batch limits and report without access to the review or publishing commands.

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
