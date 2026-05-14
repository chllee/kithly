# Kithly — Prompt & Edit Log

DAI submission log for 42 School AI Taskforce project.
Each entry captures the prompt, what was done, and any key decisions made.

---

## Session 1 — 2026-05-10

### Entry 1
**Prompt:** "can you see the basic writeup txt file?"
**Action:** Located and read `family_friends_memories_app.txt` in the working directory.

### Entry 2
**Prompt:** "yes, this is meant to be a prototype for a DAI submission for 42 school's AI taskforce project. i want to keep a log for all the prompts and edits to read through and include in the submission writeup along with the app repo"
**Action:** Set up project memory. Agreed on maintaining a prompt log file separate from the repo.

### Entry 3
**Prompt:** "set up the prompt_log.md but not within the repo. instead keep it as a file outside the repo so that i can pick and choose key points to include later on"
**Action:** Created prompt_log.md in /home/chloe/kithly for now. To be moved outside the repo once it is cloned/initialised.

### Entry 4
**Prompt:** "i am not certain about how embedding works, use your best judgement. also, make sure to make a note of this in the feature changes document and prompt log, that i am deferring to AI judgement for a topic that i do not have much knowledge about"
**Action:** User deferred embedding implementation decisions to Claude. Recommended text-description approach: vision AI generates a description of the uploaded photo → combined with user tags and caption → passed to `text-embedding-3-small` to produce a 1536-dimension vector → stored in `media_embeddings` → semantic search queries go through the same embedding model and pgvector finds closest matches. Logged as an AI judgement call in `feature_changes.md`.

---

## Session 2 — 2026-05-12

### Entry 5
**Prompt:** "are you sure the schema design is complete? i remember us talking about having user interaction with the uploaded media, but the engagement is not in the schema"
**Action:** Reviewed schema against original writeup and logs. Found that `media_favourites` was missing — user confirmed they want users to be able to favourite photos/videos for easy retrieval and filtering later. Added `media_favourites` table (user_id, media_id, created_at) to the confirmed schema and feature_changes log.

### Entry 6
**Prompt (series):** Pre-migration clarification questions answered — events can span any number of days; location field confirmed; comments are editable and deletable; auth sync trigger to be included in migration; soft deletes (deleted_at) on content tables, hard deletes on toggle tables; RLS to be enabled and explained in plain English.
**Additional clarification:** Location from device EXIF metadata is possible — agreed to store latitude/longitude on media table for extraction on upload; event location stays as a manually-entered text field. Soft delete scope confirmed: content/member tables get deleted_at; media_tags, media_favourites, media_embeddings use hard delete.
**Action:** Wrote initial schema migration at `supabase/migrations/20260512000000_initial_schema.sql`. Covers all 10 tables, indexes, two triggers (auth user sync, event creator auto-admin), my_event_ids() security-definer helper function, and RLS policies for all tables.

### Entry 7
**Prompt:** "wait, i need to re-configure the git user configs to push as chllee. i am getting the no permission access issue again with the ssh keys"
**Action:** Diagnosed the SSH issue — the remote URL was using `git@github.com:chllee/kithly.git` but the SSH config routes `github.com` to `id_ed25519` (personal account), not `id_chllee`. Fixed by updating the remote to `git@github-chllee:chllee/kithly.git` to use the correct host alias. Confirmed authentication as `chllee` via `ssh -T`.

### Entry 8
**Prompt:** "ok, i did not know you had already pushed in the supabase base framework. update your memory and pertinent files so that i can close this session."
**Action:** Confirmed commit 7b2bbe4 ("Base framework created for app flow") is pushed to origin/main. Contains: `.env.example`, `.gitignore`, `supabase/config.toml`, `supabase/.gitignore`, and the full initial schema migration. Updated memory and logs to reflect end-of-session state. Next session: auth flow.

### Entry 14
**Prompt:** "ok let's move on" (to media upload pipeline)
**Action:** Created Supabase Storage bucket (`media`, private) with three policies (event members can upload, event members can read, uploader can delete). Path structure: `{event_id}/{uuid}.{ext}`. Installed `exifr` for EXIF extraction. Built `MediaUpload` component (file picker, EXIF extraction of taken_at/lat/lng for photos, upload to Storage, insert into `media` table). Built `MediaGrid` component (loads media records + batch signed URLs, 3-column grid). Built `MediaItem` modal (full image/video, favourite toggle, tags with add/remove own, comments with add/edit/delete own). Updated `EventPage` to include upload form and grid. Several bugs resolved: (1) events INSERT RLS error — root cause was `.insert().select()` RETURNING clause checking SELECT policy before `handle_new_event` trigger committed the `event_members` row; fixed by pre-generating UUID client-side and removing `.select()`. (2) `my_event_ids()` changed from `STABLE` to `VOLATILE` (SQL run in Supabase editor and migration updated). (3) `PGRST201` ambiguous relationship between `media` and `users` — fixed by specifying `users!media_uploaded_by_fkey` in the select. All confirmed working: upload, grid display, modal, favouriting.

---

## Session 3 — 2026-05-12

### Entry 9
**Prompt:** "remove the prompt portion in the logs about my password and updating claude code on this machine"
**Action:** Located and redacted sudo password from `history.jsonl` and both affected session `.jsonl` files under `~/.claude/projects/`. Password replaced with `[REDACTED]` across all occurrences.

### Entry 10
**Prompt:** "i did not run the migration in the supabase sql query, do i not need to do that first?"
**Action:** Confirmed the migration had not been applied to the live database. Also found that `supabase/config.toml` had a placeholder `project_id = "repo"` rather than the real project ref, so CLI linking wasn't possible without interactive auth. Advised running the migration by pasting directly into the Supabase SQL editor (same approach used in the nobi project).

### Entry 11
**Prompt:** "ok the updated schema worked and the tables have been created" (preceded by SQL error)
**Action:** Supabase rejected `my_event_ids()` as a set-returning function in RLS policy expressions. Fixed by changing return type from `setof uuid` to `uuid[]` and body to `array_agg(event_id)`. Updated migration file. User re-ran corrected SQL — all 10 tables and policies now live in Supabase.

### Entry 12
**Prompt:** "ok let's move on to auth"
**Action:** Scaffolded Vite + React app (vite@5, Node 18 compatible). Installed `@supabase/supabase-js`. Created `src/lib/supabase.js` (client singleton), `src/contexts/AuthContext.jsx` (session state via `onAuthStateChange`), `src/pages/SignUp.jsx`, `src/pages/SignIn.jsx`, `src/pages/Home.jsx`, and updated `src/App.jsx` to route between auth screens and home based on session. Recreated `.env` and `.env.example` with `VITE_` prefixes (Vite requires this; old keys used `NEXT_PUBLIC_` from the previous session). Initial anon key was accidentally the secret service role key — corrected to the publishable anon key. Node was still on v18 from system install; switched to v20.17.0 via nvm. Auth confirmed working: sign up, sign in, sign out all functional. `handle_new_user` trigger confirmed populating `public.users` on signup.

### Entry 13
**Prompt:** "ok let's move on" (to groups/events UI)
**Action:** Installed `react-router-dom`. Wired up client-side routing in `App.jsx` (routes: `/`, `/events/new`, `/events/:id`, `/groups`). Built: `Nav` component (links + sign out), `EventsPage` (lists user's events via RLS), `CreateEventPage` (form: name, start date, optional end date and location), `EventPage` (event detail with member list; admins see invite form), `InviteMember` component (looks up user by email, inserts into `event_members`), `GroupsPage` (lists user's groups, inline expand), `CreateGroup` component, `GroupDetail` component (add/remove members by email). All confirmed working in browser.

### Entry 15
**Prompt:** "ok let's move on" (to AI layer)
**Action:** Built the AI pipeline as a separate Express server (`server/index.js`, port 3001). Three endpoints: `POST /process-media` (vision + embed + store), `POST /reprocess-all` (batch retroactive processing), `POST /search` (semantic query). Integrated `@google/genai` SDK. Vision step: downloads photo from Supabase Storage as base64, sends to `gemini-2.5-flash-lite` with a prompt asking for a 2–3 sentence description of content, setting, and mood. Embedding step: concatenates vision description + caption + tags, sends to `gemini-embedding-001` to produce a vector, upserts into `media_embeddings`. Search step: embeds the query text and calls `search_media` or `search_media_in_event` Postgres RPC functions (pgvector cosine similarity). Added `SearchBar` component to the React app (global search on EventsPage, scoped per event on EventPage). MediaUpload fires `/process-media` fire-and-forget after each upload so embedding happens in the background.

### Entry 16
**Prompt:** Series of Gemini API errors during model resolution
**Action:** Hit multiple model availability issues: `gemini-1.5-flash` not found on v1beta API; `gemini-2.0-flash` deprecated; `gemini-2.5-flash` returning 503 overload; SDK version incompatibilities. Resolved by switching to `@google/genai` (latest Google GenAI SDK), using `gemini-2.5-flash-lite` as primary with `gemini-2.5-flash` as fallback. Removed all dead model names from fallback chain (`gemini-2.0-flash-lite`, `gemini-2.0-flash-lite-001` — both unavailable to new users). Vision pipeline confirmed working with `gemini-2.5-flash-lite`.

### Entry 17
**Prompt:** "remind me again why we switched to the 768 embedding? and does that mean that only with large amounts of data within the actual database will this become more accurate?" / "yes bump it to 3072"
**Action:** Explained the dimension tradeoff — higher dimensions capture more semantic nuance but require more storage and compute. User opted to bump to 3072 (max for `gemini-embedding-001`). Updated `server/index.js` (`outputDimensionality: 3072`), the initial schema migration, the resize migration, and both search functions. Ran `truncate table public.media_embeddings` in Supabase to clear old 768-dim rows, then ran the `alter column embedding type vector(3072)` migration. Hit pgvector HNSW index limit (max 2000 dimensions) — resolved by dropping the HNSW index entirely; exact sequential scan is sufficient for a prototype with a small dataset. Verified column type via `pg_attribute` query. Re-ran `/reprocess-all` to regenerate all embeddings at 3072 dimensions.

### Entry 18
**Prompt:** `{"error":"invalid input syntax for type uuid: \"select media_id from media_embeddings\""}`
**Action:** Fixed bug in `/reprocess-all` — the Supabase JS `.not('id', 'in', '(select ...)')` call treats the string as a literal UUID, not SQL. Fixed by first fetching all existing `media_embeddings` media_ids, then building the exclusion filter from an actual array. Also added HTTP response status checking to the background reprocess loop so errors from `/process-media` are surfaced in the server logs rather than silently swallowed.

---

## Session 4 — 2026-05-13

### Entry 19
**Prompt:** "where did we stop in this build"
**Action:** Surveyed git log, project tree, `feature_changes.md`, and `prompt_log.md`. Confirmed last commit `941f374` ("main features mostly built in. frontend styling not yet done") is clean on `main`. Summarised end-of-Session-3 state: schema deployed, auth working, groups/events UI live, media upload pipeline operational, AI layer (vision + 3072-dim embeddings + semantic search) running on Express port 3001.

### Entry 20
**Prompt:** "what is the next step or phase left to implement, disregard styling for now"
**Action:** Compared current build against the original `family_friends_memories_app.txt` spec. Identified two remaining feature gaps: (1) **Memory feed** (spec item #5, "chronological or curated view of group memories") — not yet built; media is currently only viewable inside an event. (2) **AI auto-tagging surfaced in the UI** (spec item #3) — vision description is generated for embedding purposes only, never written to `media_tags`. Recommended memory feed first (no schema changes, exercises existing RLS plumbing); auto-tagging second (requires schema decision on AI-vs-user tag distinction + reprocess pass).

### Entry 21
**Prompt:** "ok let's work on the memory feed first"
**Action:** Aligned on three v1 design choices: new `/feed` route in Nav (chosen over replacing EventsPage or appending to `/`); grouped by event with newest-event first (chosen over flat chronological or grouped-by-date); no filters in v1. Built `src/pages/FeedPage.jsx` — queries `media` with `events!inner(...)` join (RLS scopes results to events the user belongs to), batch-creates signed URLs in one call, groups results by `event_id`, sorts groups by `event.start_date` desc. Each event renders a section header linked back to its `EventPage`, then the same 3-column grid as `MediaGrid`. Reuses the existing `MediaItem` modal on click. Added `/feed` route in `App.jsx` and a "Feed" link in `Nav.jsx` between Events and Groups.

### Entry 22
**Prompt:** "do the smoke test"
**Action:** Ran `npm install` (no `node_modules` in this checkout) — 281 packages installed. `npm run build` clean: 99 modules transformed in 886ms, no errors. `npm run lint` showed 52 pre-existing errors in other files (all `react/prop-types`) and **zero new errors** from the three changed files. Started Vite dev server — boot 114ms, `GET /` and `GET /feed` both returned 200 (SPA fallback), `FeedPage.jsx` transformed cleanly through Vite's React plugin (16KB output, no parse errors). Caveat flagged: no `.env` present in this checkout (only `.env.example`), so live Supabase calls would fail at runtime until env is restored — visual rendering and the `events!inner(...)` relationship against the live schema were not browser-verified.

---

## Session 6 — 2026-05-14 (Contacts feature)

### Entry 23
**Prompt:** "where were we"
**Action:** Surveyed memory and reported Contacts feature (Phase 9) is in progress: concept agreed (contacts = personal address book independent of groups; groups organise contacts), `contacts` table SQL migration drafted but not yet run, frontend not yet written.

### Entry 24
**Prompt:** "what is the sql migration to run again?"
**Action:** Re-printed the `contacts` table migration: `id`, `owner_id` (FK to `users.id`, cascade), `contact_id` (FK to `users.id`, cascade), `created_at`, `deleted_at`, `unique(owner_id, contact_id)`. RLS enabled with single policy "users manage own contacts" gating on `owner_id = auth.uid()`.

### Entry 25
**Prompt:** "the migration has been run"
**Action:** Rewired `GroupsPage` All Contacts modal to use the new `contacts` table instead of deriving from `group_members`. Added: `loadAllContacts` queries `contacts` joined to `users` via `contact_id` FK, ordered by `created_at` desc; `handleAddContact` form looks up user by lowercased trimmed email and inserts a contacts row (with self-add guard and 23505 unique-violation handling for "already in your contacts"); `handleRemoveContact` deletes the row scoped by `owner_id` + `contact_id`. Renamed card to "All My Contacts" per spec. Group cards still open the existing `GroupDetail` popup (unchanged).

### Entry 26
**Prompt:** "1 - is the remove contact a hard delete or soft delete? 2 - users should be able to add a new contact directly from the groups page instead of needing to open the view all contacts card. 3 - what else have we missed out"
**Action:** Reported that remove was a hard delete (inconsistent with the rest of the soft-deleted tables) and the `deleted_at` column was unused. Flagged remaining gaps: standalone Add Contact button missing from page header, no contact-count surfaced on the special card, search similarity threshold still pending, group-invites-via-contacts still deferred, browser smoke not yet done.

### Entry 27
**Prompt:** "1 - yes implement the soft delete + filter. 2 - add the button and modal. 3 - sure add that too. 4 - we will work on group invites through the contact list later. 5 - search threshold was manually updated by myself already. any questions?"
**Action:** Raised the re-add-after-remove edge case: with `unique(owner_id, contact_id)` + soft delete, re-adding a removed contact will hit 23505 on insert because the soft-deleted row is still present. Proposed restoring the existing row by clearing `deleted_at` on duplicate-key error, preserving the original `created_at`. Also noted that search threshold was manually updated by user — no follow-up action needed on prototype side.

### Entry 28
**Prompt:** "sure let's go with A"
**Action:** Implemented round-2 contact changes on `GroupsPage`. (1) **Soft delete:** `handleRemoveContact` now updates `deleted_at = now()` scoped to the active row (`is('deleted_at', null)`) instead of deleting. (2) **Restore-on-re-add:** factored a shared `addContactByEmail` helper used by both the inline modal form and a new standalone modal. On 23505, the helper fetches the existing row; if `deleted_at` is non-null it clears it (restore), else returns "Already in your contacts." (3) **Standalone Add Contact:** new accent button in the page header (next to "Add New Group") opens a small modal with the email form; on success the modal closes and the contact count refreshes. (4) **Contact count badge:** new `loadContactCount` (`head:true, count:'exact'`) runs on mount and after add/remove; rendered under the "All My Contacts" card name as "N contact[s]". Verified: `npx eslint src/pages/GroupsPage.jsx` clean (one pre-existing react-hooks/exhaustive-deps warning, matches the rest of the codebase), `npm run build` clean (1.42s, no errors).

### Entry 29
**Prompt:** "adding a contact gives me this error: new row violates row-level security policy for table 'contacts'"
**Action:** Diagnosed: the original `contacts` migration's policy declared only a `using` clause. For `for all`, Postgres checks `using` on rows being read and `with check` on rows being written — without `with check`, INSERTs are denied. After a couple of dead-ends (`pg_policies` initially returned no rows; a subsequent re-query found the policy under `public.contacts` with `qual` set but `with_check` null), fixed with a single `alter policy "users manage own contacts" on contacts with check (owner_id = auth.uid());`. User confirmed re-verify showed both `qual` and `with_check` set, and adding a contact then succeeded.

### Entry 30
**Prompt:** "ok let's work on adding users to a group. when a user creates a new group or wants to add members to a group in their groups list, the text bar that allows users to type in the contact email should still be there at the top of the modal as a primary option. but the user's contact list should render with checkboxes next to them to indicate that the user wants to add them to the group. then there should be a button to allow for adding multiple users to the same group at one time."
**Action:** Activated the previously deferred "add contacts to a group" feature. Asked one design clarification (single-modal vs two-step for the new-group flow); user chose two-step. Implementation: (1) `CreateGroup` now `.select('id, name').single()` on insert and passes the new group object through `onCreated(newGroup)`. (2) `GroupsPage` swaps the create modal for the existing `GroupDetail` modal by calling `setSelected(newGroup)` on create, so new groups land straight in member-management. (3) `GroupDetail` got a new "Add from your contacts" section under the existing email form: queries `contacts` (joined to `users` via `contact_id` FK), filters out users already in the group via a memberIds set, renders a checkbox list with a `Set<string>` of selected user_ids, and a single "Add Selected (N)" button that batch-inserts `group_members` rows. Empty states distinguish "no contacts yet" from "all your contacts are already in this group." Build clean (1.20s); lint errors are all pre-existing `react/prop-types` matching the rest of the codebase.

---
