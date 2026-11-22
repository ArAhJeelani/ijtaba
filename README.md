# Ijabah — One Dua Away

A React + TypeScript MVP for discovering Qur’anic duas, saving a personal collection, and calculating the last third of the night.

## Run

Install Node.js 22+ and pnpm, then run `pnpm install` and `pnpm dev` from this folder. `pnpm build` checks TypeScript and builds `dist/`. `pnpm test` runs calculator tests (Node 22.6+).

## Install and test offline

Run `pnpm build`, then `pnpm exec vite preview --host 127.0.0.1` and open the loopback URL it prints. The service worker is enabled in production builds. For phone testing, use an HTTPS staging URL. In Safari on iPhone, use **Share → Add to Home Screen**, then enable **Open as Web App** if offered. In Chrome on Android, use **⋮ → Add to home screen → Install**.

Open the app online once to finish downloading the offline files. Then turn off connectivity and reopen it to test the library, collections, calendar and manual Tahajjud calculator. City prayer times and external links require a connection. The optional intro soundtrack is outside the offline cache, and typography may use system fallback fonts. Personal entries, schedules, and backup/import continue to use browser-local storage and files.

Publish the contents of `dist/` together, serve `/sw.js` as JavaScript with revalidation enabled, and configure the existing SPA route fallback and `/api/*` routing. The worker keeps the current release active while its tabs or installed windows are open. Close those windows and reopen the app to pick up a waiting release.

## Architecture

- `src/App.tsx`: routed pages, navigation, footer and reading experience.
- `src/components/`: reusable dua cards, save actions and calculator.
- `src/data/duas.ts`: typed, source-linked starter content.
- `src/state/Collection.tsx`: collection operations and browser persistence. Replace this boundary with a Supabase repository later.
- `src/utils/night.ts`: independently testable elapsed-time calculation.
- `src/styles.css`: brand tokens, painterly compositions and responsive reading layouts, with Tailwind available for utilities.
- `public/assets/`: the supplied artwork and unmodified logo.

React renders reusable components; TypeScript checks data contracts; Vite develops and bundles; React Router handles URLs; Tailwind provides CSS utilities; Motion handles reduced-motion-aware page fades; Lucide supplies interface icons.

## MVP behavior

Search and category filtering; duplicate-free saves; persistent ordering; remove/reorder; session read flags and reset; one-at-a-time reading; optional transliteration; clearly labeled personal entries; manual dated Maghrib/Fajr calculator. Saved collection is browser-local; read progress resets on refresh. No authentication, live prayer-time API, or cloud sync.

Calculator entries use the browser’s timezone, explicitly displayed in the UI. The location field is only a label. Dated inputs account for midnight and elapsed-time changes across DST. For a timezone’s ambiguous fall-back hour, use an unambiguous local timetable time; future provider integration should store explicit UTC offsets. No example prayer times are prefilled as live data.

## Content workflow

Before adding content, verify the Arabic against the linked Qur’an verse or an identified hadith edition, check verse excerpts and hadith grading, record translator permission/attribution, and obtain a second editorial review. The starter English text is a rendering of meaning, not an attributed published translation. Personal prayers never receive scriptural authenticity claims. Broader categories appear only when reviewed content exists.

## Future integration

Keep account IDs, database access and synchronization in the collection state/repository layer. Add a versioned schema migration before changing stored fields. Prayer-provider integration needs separate evening/following-day requests, method selection, IANA timezone handling, error states and confirmed local timetable guidance.

Artwork supplied by the project owner; confirm rights before a public launch. Google Fonts is optional network-loaded typography with system/serif fallbacks.

## Painted redesign

Background sound uses the supplied MP3 in `public/audio/nasheed-humming.mp3` at 30% volume. `useAnimationNasheed` starts it only during an animation and pauses/mutes it on cleanup. There is no standalone music control. If the browser blocks autoplay, the next pointer or keyboard interaction during the animation retries playback; ordinary pages never retry or play it.

BroadcastChannel prevents overlapping playback in updated Ijabah tabs. Skipping or pausing the main opening stops its soundtrack; leaving the Tahajjud entrance also stops sound.

The closing logo includes a sequential calligraphic ink reveal: “Just know… Every du’a has an answer. Every du’a has an Ijabah…” `ClosingWriting.tsx` reveals the continuous text with rough-edged SVG stroke masks, followed by an underline flourish. Enter Ijabah appears only once the writing finishes. The complete intro lasts 29 seconds; its original scenes still occupy the first 20 seconds. The main soundtrack fades over the final three seconds using the animation clock, so pausing/resuming also preserves the writing and fade position. The Tahajjud soundtrack fades over its last second. Playback still stops and mutes on exit.

`src/components/Arrival.tsx` and `arrival.css` implement one continuous 24-second SVG painting: a light rises from painted raised hands into the sky, branches into three possible answers (a blooming flower, a light kept above, and diverted dark washes), then reveals the original logo and automatically returns to the website. Pause stops the clock, CSS layers, and soundtrack; replay resets them together. Skip is always available. Reduced motion presents the logo and all three explanations immediately without audio. This opening runs once on each fresh application load, regardless of the initial route. Returning home through navigation does not replay it; the homepage offers an explicit replay button. The arrow entrance mounts only on the Tahajjud route.

`src/painted.css` applies the canvas texture and brush shapes to every page, navigation, inputs, buttons, prayer excerpts, reading dialog and footer. Arabic stays native text. The original generated canvas and exact prompt are saved in `artwork-originals/painted-canvas-v1.png` and `painted-canvas-v1.prompt.txt`. It was created with the built-in image-generation tool and compressed as `public/assets/painted-canvas-v1.webp`. The supplied logo remains unchanged in spelling and composition.

# ijtaba
