# Ijabah — One Dua Away

A React + TypeScript MVP for discovering Qur’anic duas, saving a personal collection, and calculating the last third of the night.

## Run

Install Node.js 22+ and pnpm, then run `pnpm install` and `pnpm dev` from this folder. `pnpm build` checks TypeScript and builds `dist/`. `pnpm test` runs calculator tests (Node 22.6+).

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

Background sound uses the supplied MP3 in `public/audio/nasheed-humming.mp3`. Tap Play nasheed to start; it loops at 30% volume and pauses/resumes through the toggle. The player remains mounted across routes. `preload="none"` avoids downloading the track until requested. The ascent accelerates rapidly through the sky with a shorter light-trail reveal.

Nasheed play/pause is synchronized across open Ijabah tabs through BroadcastChannel. Only one tab owns playback; Pause nasheed in any connected tab stops it. Pending playback can be cancelled immediately. The opening now reads “Your du’a may be one away,” and the upward flight takes approximately 0.72 seconds.

`src/components/Arrival.tsx` and `arrival.css` implement one continuous 24-second SVG painting: a light rises from painted raised hands into the sky, branches into three possible answers (a blooming flower, a light kept above, and diverted dark washes), then reveals the original logo and automatically returns to the website. Pause stops both the elapsed-time clock and CSS layers; replay resets them together. Skip is always available. Reduced motion presents the logo and all three explanations immediately. The first-visit marker is `ijabah.arrival.v4`; the homepage offers replay afterward.

`src/painted.css` applies the canvas texture and brush shapes to every page, navigation, inputs, buttons, prayer excerpts, reading dialog and footer. Arabic stays native text. The original generated canvas and exact prompt are saved in `artwork-originals/painted-canvas-v1.png` and `painted-canvas-v1.prompt.txt`. It was created with the built-in image-generation tool and compressed as `public/assets/painted-canvas-v1.webp`. The supplied logo remains unchanged in spelling and composition.
# ijtaba
