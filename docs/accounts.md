# Ijabah accounts and organizer sync

Guests can keep using the library and the browser organizer. To enable accounts, configure a development Supabase project and add its URL and publishable key to an ignored .env.local file based on .env.example. Restart Vite after changing environment values. The browser accepts HTTPS project URLs and HTTP only on localhost or 127.0.0.1. Use the sb_publishable_ key. Never put an administrator, service-role, or sb_secret_ key in a Vite environment variable.

## Configure Supabase

1. Create or select a development project on a plan you authorize. Apply supabase/migrations/20261124000100_organizers.sql to that database, for example with the SQL Editor. Start with a clean development project and run the migration once.
2. In Authentication, enable the Email provider and new user signup. Enable email confirmations and set the minimum password length to at least 12 to match the app. Set the Site URL to the canonical frontend origin.
3. Add the exact callback URLs for each approved frontend origin. For local Vite these are http://127.0.0.1:5173/auth/callback and http://127.0.0.1:5173/auth/callback?flow=recovery. Add the equivalent HTTPS addresses for hosted environments and use the same host and port to request and open a default PKCE email link. Use narrow redirect entries.
4. Configure delivery and verify both confirmation and recovery emails against test inboxes. The default PKCE link expects the initiating browser to hold the verifier. The callback also supports explicitly configured email links with token_hash and type=email or type=recovery. Keep email links private.
5. Run pnpm install and pnpm dev. Visit /signup or use Sign in in the header. Production hosts must serve the SPA shell for /login, /signup, /forgot-password, /auth/callback, /account, and /account/password. Keep normal SPA routes and the existing /api routing. Deploy only after approval.

## Storage and security

Supabase Auth manages credentials, session restoration, refresh, confirmation and recovery. Auth user metadata holds the optional display name, which is display-only and carries no authorization claims. Account email and creation time come from the Auth record. Organizer export is available in My Du’as under Backup & recovery.

PostgreSQL stores one versioned organizer row per Auth user, with a primary key and cascading foreign key on owner_id. It stores private du’as, saved IDs in their existing order, save timestamps, collections, memberships, schedules, calendar selections, and profile follows as one validated organizer document. Public catalog text stays in the app. The existing versioned format preserves stable client IDs and cross-section references across backup and cloud storage. A document keeps multi-section operations atomic and preserves the existing schema compatibility. The tradeoffs are full-document writes and application-level validation of references within that owner’s document. Existing schedules retain wall-clock date and time semantics on each device.

The anon role has no table grants. The authenticated role has owner-only SELECT, INSERT, UPDATE and DELETE policies. Column grants prevent updating owner_id. A trigger requires each revision to increment by one. Vite serves public assets and the Supabase SDK connects directly to the Supabase API. The service worker does not cache responses from the Supabase API. Supabase stores private account data under the project’s terms. The app uses HTTPS in hosted environments and does not provide end-to-end encryption. Backups are plain-text files and should be stored privately.

## Sync and browser import

On sign-in the account organizer loads into a separate in-memory scope. Switching accounts remounts that scope. Guest data stays on the browser under its existing key and is never uploaded simply by signing in. A new account can explicitly copy the guest organizer after reviewing counts. The original remains recoverable in guest mode. A browser marker associates the guest copy with the first account that confirms migration, so it is not offered to other accounts on the same browser. An account with a stored organizer keeps its existing cloud copy. There is no automated merge. For a deliberate replacement, export both copies and use the existing backup preview.

The app shows pending edits immediately and labels them as syncing until PostgreSQL confirms the write. Writes serialize and compare the expected revision. A mutation ID lets the app recognize an already-committed write after a lost response. A conflict preserves local pending edits in memory and offers an export before loading the account copy. Retry transient failures using the sync controls. Export before closing the tab if data has not synced. Another device loads the newest confirmed version on sign-in or refresh.

## Verification

Run pnpm test and pnpm build. The database test applies the production migration using embedded PostgreSQL with simulated Supabase roles and Auth IDs. Auth tests use the actual client library against a fixture service. These checks require no project credentials.

For release acceptance, use two separate browser profiles and at least two test accounts. Confirm signup, invalid credentials, password reset, refresh restoration, and local sign-out. Create and edit a private prayer, collection membership and schedule, then open the same account in the second profile and confirm the data. Try stale concurrent edits and verify the newer version stays saved. Switch to a different account and confirm isolation. Repeat with network interruption, and verify guest import only after consent and only for a new organizer.

## Current limits

Google OAuth, self-service account deletion, live push updates, automatic merge, and durable offline cloud writes are not included. Account deletion requires a separately authorized administrative workflow that removes the Auth identity, which cascades to the organizer. Guest copies and downloaded backups remain under the user's control. No hosted project, email delivery or production database is needed for local tests.
