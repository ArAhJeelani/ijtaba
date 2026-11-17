# GTA city prayer-times service

The active calculator uses AlAdhan calculated times, not masjid timetables. Supported cities: Toronto, Mississauga, Brampton, Markham, Pickering, Ajax, Oshawa.

Vite development and preview mount `/api/cities` and `/api/tahajjud?city=toronto&date=2026-11-17`. Run `node server/index.mjs` for a standalone API; production must route `/api/*` to this service. Deploying `dist` alone does not deploy the backend.

`cities.mjs` fetches evening Maghrib and next-day Fajr using city-centre coordinates, ISNA (method 2), America/Toronto, and ISO timestamps with offsets. The result is calculated from these two instants, not the provider's Lastthird field. Responses are checked for requested date, timezone, method, and valid timestamps. One-hour bounded in-memory cache; simultaneous requests share one fetch. Failures leave manual entry available.

The manual form in TahajjudCalculator.tsx works locally without an API. Its datetime entries use the visitor's browser timezone, shown in the form. Users must enter evening Maghrib and the following morning's Fajr from their trusted timetable.

Documentation: https://aladhan.com/prayer-times-api
Tests: `node --test server/cities.test.mjs` and `node --experimental-strip-types --test src/utils/night.test.ts`.

Earlier masjid-source and search files remain as unused prototypes. The active app and server no longer expose that flow. No background refresh job or public deployment has been created.
