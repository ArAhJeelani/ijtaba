# Understanding the collection and calendar

Ijabah's existing library, painted styling, logo, opening animation, Tahajjud animation, and prayer-time calculator remain in place. This feature extends the existing browser collection store. The backend only supplies prayer-time calculations; there is no account database for prayers.

## Stage 1 — Understand and preserve

Before this change, the app supported library search, category filtering, saved IDs, personal prayers, ordering, reading progress, and untimed daily collections. The existing calendar and `/calendar?date=YYYY-MM-DD` links were preserved and extended.

`src/data/organizer.ts` describes the new data shapes. A TypeScript type is a description of what fields an object must contain. It helps catch mistakes before the app runs.

## Stage 2 — Saved du’as and custom collections

- `src/components/DuaCard.tsx`: saving feedback, read/schedule/collection controls, save date and next schedule indicator.
- `src/components/MyDuasPage.tsx`: saved list, order controls, session reading progress, personal prayers.
- `src/components/CollectionsPanel.tsx`: create, rename, delete and schedule a whole collection.
- `src/components/CollectionMembershipDialog.tsx`: put the same du’a into multiple collections.
- `src/components/DuaReader.tsx`: selectable Arabic, source, translation, optional transliteration, reading progress, previous/next and keyboard arrows.

A collection stores references to du’a IDs, not copies of prayer text. Renaming a collection changes its label, not its ID. This is why its memberships and schedules survive renaming.

Removing a du’a from the main saved list keeps its existing schedule and named collection memberships. Deleting a named collection removes that collection's memberships and whole-collection schedules, while retaining shared du’as and their individual schedules. The confirmation explains this. Removing a schedule never removes the du’a.

## Stage 3 — Calendar and schedule editor

- `src/components/DuaCalendar.tsx`: month/week navigation, selected date, today, upcoming and all schedules.
- `src/components/ScheduleEntry.tsx`: read, edit, pause/resume and remove controls.
- `src/components/ScheduleDialog.tsx`: target, first date, time, repeat, selected weekdays and optional note.
- `src/components/OrganizerDialog.tsx`: native modal with focus containment, Escape dismissal, focus restoration and scroll locking.

Multiple schedules can reference the same du’a. Whole-collection schedules read the collection's current members, so adding another prayer to that collection includes it in the next reading session.

Untimed daily collections from the previous version still appear under “Gathered for this day.” They are not silently assigned a time. The Discover page still accepts a date link for this flow, and saving to My Du’as is now available independently.

## Stage 4 — Persistence and recurrence

- `src/state/Collection.tsx`: shared React state and actions, plus browser persistence.
- `src/state/organizerStorage.ts`: validation and migration of old records.
- `src/utils/schedules.ts`: recurrence rules, date arithmetic and finding the next occurrence.

The storage key remains `ijabah.collection.v1`; the object now has `version: 2`. Keeping the same key allows existing users' saved prayers and daily lists to be loaded. Older saves display “Saved before date tracking” rather than an invented timestamp.

Schedules store a calendar date and a local clock time, such as `2026-11-19` and `21:00`. They follow the device timezone. Traveling changes the absolute instant represented by that clock time. This is intentional and explained in the editor. Calendar date arithmetic uses local noon to avoid ordinary daylight-saving midnight/duration errors.

Recurrences are evaluated when displaying a day; the app does not write hundreds of duplicate events:

- Once: only the chosen date.
- Every day: each date at or after the first date.
- Selected weekdays: selected weekday numbers at or after the first date.
- Every week: the weekday of the first date.
- Every month: the same day number. Months without it are skipped.

Editing changes the entire series; single-occurrence exceptions are not included in this version. Pausing hides occurrences without deleting the stored rule. “Manage all schedules” includes paused and past schedules. Upcoming shows the next occurrence per active schedule, up to eight entries.

Prayers, notes and calendar entries remain in localStorage; no prayer or note is sent to the prayer-time API. This is device-local persistence, not encrypted storage or cloud backup. Other people using the same browser profile can access it. Clearing site data removes it. Storage errors are displayed. Open tabs listen for storage updates, though truly simultaneous edits are still last-write-wins.

## Stage 5 — Tahajjud and motion

`src/components/TahajjudCollection.tsx` adds the “My Tahajjud Du’as” shortcut below the existing calculator. Create the collection, add prayers through Collections, then schedule a custom time. The current city/manual calculator remains available to check the intended night.

This version does not automatically recalculate recurring schedule times when Fajr changes. It explicitly says to check the chosen night and schedule manually. It never fabricates a prayer time.

`src/components/organizer.css` adds the shared painted surfaces, responsive layout, calendar styles, modal entrances and save confirmation. Motion respects reduced-motion preferences. Native date/time inputs remain readable and keyboard-accessible.

## How to test it yourself

1. Open Discover and save a du’a. Check the navigation counter and My Du’as.
2. Choose Schedule du’a, then Tomorrow · 9 PM, and save.
3. Open Calendar and select tomorrow. Edit the time and repeat rule.
4. Refresh, skip the opening animation, and check that the edited time remains.
5. Switch to Week and move to next week to inspect a weekly repeat.
6. Pause it; it leaves the calendar but remains in Manage all schedules. Resume it there.
7. Remove the schedule; check that the saved du’a remains.
8. Open a du’a's Collections control, create a collection and add the prayer. Add it to another collection without duplicating its text.
9. Rename a collection, schedule the whole collection, and try deleting it. Shared prayers and individual schedules remain.
10. Open the schedule panel on a narrow screen. Tab through controls and press Escape. Calendar dates also accept arrow keys.

Automated checks: `npm test` (or `pnpm test`). Build: `npm run build` (or `pnpm build`). Tests cover legacy migration, persistence round trips, safe collection deletion, recurrence boundaries, month-end/leap dates, pause/time edits and existing prayer-time calculations.

Browser verification completed for library save → My Du’as → tomorrow schedule → time edit → refresh → weekly occurrence; selected weekdays; reading/Escape; pause/resume; collection create/rename/delete; schedule removal with du’a retained; and a 390px mobile calendar/editor. Temporary test collection and schedule were removed afterward. `calendar-preview.jpg` captures the test schedule before cleanup.

There are no delivered notifications, account sync or background reminder service in this version.
