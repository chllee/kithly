# Kithly — Feature Decisions Log

Tracks features confirmed, deferred, or ruled out during planning. For use in the DAI submission writeup.

---

## Schema & Core Architecture

| Feature | Decision | Reason |
|---|---|---|
| Groups | Kept | Personal contact lists per user for ease of bulk invitation to events; not shared or collaborative |
| Group ownership | Single creator only, no roles | Groups are private to the creator; no need for shared ownership or admin tiers |
| Group member overlap | Allowed | The same person can appear in multiple groups within one user's account (e.g. a mutual friend in both "Uni Friends" and "Work" groups) |
| Events as primary unit | Confirmed | Users create events and invite members directly; groups assist invitation only |
| Photos scoped to events | Confirmed | No direct-to-group uploads; events provide structure for all photo uploads |
| Event privacy | Private only (invited members) | Simplicity for prototype; sharing/public links deferred to future |

## Invitations

| Feature | Decision | Reason |
|---|---|---|
| Invite by email to non-users | Deferred | Invitees must create an account first; no pending invite table needed for prototype |
| Pending invites table | Deferred | Not needed given above decision |

## Event Roles

| Feature | Decision | Reason |
|---|---|---|
| Single creator per event | Confirmed | One user creates the event and is the default admin |
| Multiple admins per event | Confirmed | Additional admins can be promoted by any existing admin |
| Admin/member roles | Confirmed | Two-tier role system is sufficient for prototype |
| Additional role tiers (e.g. moderator) | Deferred | Not needed for prototype |

## Media Interactions

| Feature | Decision | Reason |
|---|---|---|
| Comments on media | Confirmed | Any event member can comment on any photo or video |
| Favourites on media | Confirmed | Users can favourite photos/videos for easy retrieval and filtering later; stored in `media_favourites` table |
| User-specific tags | Confirmed | Each user can apply their own tags to the same media item; enables richer semantic search |
| Media ratings | Deferred | Removed from prototype scope; to be revisited later |

## AI Judgement Calls

| Topic | Decision | Reason |
|---|---|---|
| Embedding implementation | Deferred to AI judgement | User unfamiliar with embeddings; Claude recommended text-description approach (vision model generates description → combined with tags/caption → embedded via text-embedding-3-small → stored as 1536-dimension vector in pgvector) |

## Embeddings & Search

| Feature | Decision | Reason |
|---|---|---|
| Semantic search via pgvector | Confirmed | Core feature; one embedding per media item |
| Tags feed into embedding generation | Confirmed | User-added tags are included as input when generating embeddings, enriching search accuracy |
| Separate text embedding for tags/captions | Deferred | Tags are folded into the single embedding input rather than stored as a separate vector |
| Video embeddings | Deferred | Requires frame sampling; too complex for prototype. Embeddings cover photos only for now |

## Platforms

| Feature | Decision | Reason |
|---|---|---|
| React web app | Confirmed, building first | Primary platform for prototype |
| React Native mobile app | Deferred | Only if time permits after web app is complete |

## Authentication

| Feature | Decision | Reason |
|---|---|---|
| Auth provider | Supabase Auth (built-in) | No third-party auth library needed; Supabase handles sessions, JWTs, and refresh tokens out of the box |
| Auth method | Email + password only | Sufficient for prototype; OAuth (Google, GitHub etc.) deferred |
| OAuth / social login | Deferred | Not needed for prototype scope |
| First/last name at signup | Confirmed | Passed as `raw_user_meta_data` so the `handle_new_user` trigger can populate `public.users` immediately on signup without a second round-trip |
| Email confirmation | Disabled for prototype | Simplifies testing; can be re-enabled before any real-user deployment |

## Technical Decisions

| Decision | Detail | Reason |
|---|---|---|
| Frontend framework | Vite + React (not Next.js) | Simpler setup for a prototype SPA; no SSR needed |
| Environment variables prefix | `VITE_` | Vite requires this prefix to expose env vars to the browser; `NEXT_PUBLIC_` from the initial scaffold was incorrect |
| Migration deployment | Pasted directly into Supabase SQL Editor | Supabase CLI linking requires interactive password prompt that can't be automated in this environment |
| `my_event_ids()` return type | Changed from `setof uuid` to `uuid[]` | Postgres does not allow set-returning functions in RLS policy expressions; returning an array with `array_agg()` resolves this |
| Node.js version | v20.17.0 via nvm | System Node (v18) is below the minimum required by create-vite@9 and deprecated by `@supabase/supabase-js`; v20 installed via nvm resolves both |

## Groups & Events UI

| Feature | Decision | Reason |
|---|---|---|
| Client-side routing | `react-router-dom` | Standard SPA routing; routes: `/` (events list), `/events/new`, `/events/:id`, `/groups` |
| Invite by email only | Confirmed | Users must already have an account; looked up by email in `public.users` |
| Group member add/remove | Hard delete on remove | Consistent with schema decision — `group_members` uses hard delete |
| Event member invite | Admin-only | Only event admins can invite new members; enforced in UI and by RLS |
| Groups page layout | Inline expand (no separate route) | Groups are simple lists; a full page per group is unnecessary for prototype |

## Memory Feed

| Feature | Decision | Reason |
|---|---|---|
| Route placement | New `/feed` route in Nav | Cleanest separation: `EventsPage` stays as the events list, feed has its own page. Considered replacing `/` with the feed (Instagram-style) or appending below the events list; both judged either too aggressive or too cluttered |
| Ordering | Grouped by event, newest event first | More structured than a flat chronological stream; less abstract than a date-grouped view; lets users jump back into an event from the section header |
| v1 filters | None | Ship the minimum viable feed first; favourites toggle, per-event filter, and photo/video toggle all deferred until the feed is in use and a real filtering need surfaces |
| Empty events | Skipped | Events with no media don't render a section — querying `media` first (with `events!inner`) naturally excludes them, and prevents the feed from filling up with empty headers |
| Reuse of `MediaItem` modal | Confirmed | Clicking a feed thumbnail opens the same modal used in `EventPage`/`MediaGrid` — favourites, tags, and comments all work consistently across surfaces |

## AI Layer

| Feature | Decision | Reason |
|---|---|---|
| AI backend | Separate Express server (port 3001) | Keeps AI processing off the Supabase client; runs as service role; handles long-running vision + embed calls without blocking the frontend |
| Vision model | `gemini-2.5-flash-lite` with `gemini-2.5-flash` fallback | Primary is fast and cheap; fallback handles 503 overload errors gracefully; older models (`gemini-2.0-flash-lite` etc.) dropped — unavailable to new users |
| Embedding model | `gemini-embedding-001` at 3072 dimensions | Highest available quality from the model; user chose 3072 after learning higher dimensions capture more semantic nuance |
| Embedding input | Vision description + caption + tags concatenated | Combines AI-generated content description with user-provided metadata for richer search signal |
| Embedding generation timing | Fire-and-forget after upload | Upload returns immediately; embedding runs in background so the user isn't blocked waiting for AI processing |
| `/reprocess-all` endpoint | Confirmed | Retroactively embeds photos that were uploaded before the AI pipeline was in place, or that failed during earlier debugging |
| HNSW index | Dropped for prototype | pgvector HNSW supports max 2000 dimensions; 3072 exceeds this limit. Exact sequential scan is used instead — acceptable performance for a small prototype dataset |
| Similarity threshold | 0.3 cosine similarity minimum — **pending increase** | 0.3 is too loose in practice: all 4 test photos (girl, puppy, 2 giraffes) were returned for queries like "dog", "girl", "animal". User to update both `search_media` and `search_media_in_event` SQL functions in Supabase. Suggested range: 0.5–0.55. Must be updated in both functions to stay consistent. |
| Search scope | Global (all events) or per-event | `search_media` covers all events the user belongs to; `search_media_in_event` scopes to a single event; UI exposes both depending on context |
| Bulk upload | Deferred | Current uploader handles one file at a time; multi-file support to be revisited if time permits |

## Contacts

| Feature | Decision | Reason |
|---|---|---|
| Contacts as personal address book | Confirmed | Contacts are per-user, independent of groups. Groups are just one way to organise the address book. Mirrors how a phone contacts list works |
| Storage | New `contacts` table (`owner_id`, `contact_id`, soft-delete column) with `unique(owner_id, contact_id)` and a single RLS policy "users manage own contacts" gating on `owner_id = auth.uid()` | Minimal schema for an address book; uniqueness constraint prevents duplicate adds; RLS keeps each user's address book private |
| Lookup method | Email only (must be an existing Kithly user) | Simplest path for the prototype; no pending-invite or non-user flow required |
| Phone / @id lookup | Deferred | Email is enough for the prototype |
| Adding contacts into groups from the address book | Deferred | Groups continue to use direct email invite for now |
| UI placement | `All My Contacts` modal as the first card on `GroupsPage` | Keeps the Groups page as the single hub for "people in my orbit"; contacts and groups live side-by-side without adding another route |
| Group cards behaviour | Unchanged — open existing `GroupDetail` popup | Avoids regressing group membership flow while introducing the new contacts surface |
| Remove contact | Soft delete (set `deleted_at`) | Consistent with the rest of the soft-deleted tables (`groups`, `events`, `media`, `group_members`); preserves the original `created_at` on the row |
| Re-adding a removed contact | Restore the existing soft-deleted row (clear `deleted_at`) on duplicate-key | The `unique(owner_id, contact_id)` constraint would otherwise block re-adds; restoring keeps history continuous and avoids dropping the constraint |
| Add Contact entry points | Two: standalone header button on `GroupsPage` AND inline form inside the "All My Contacts" modal | The standalone button is faster for one-off adds; the inline form is for users already managing their list |
| Contact count surface | Rendered on the "All My Contacts" special card via `head: true, count: 'exact'` query | Cheap query, gives an at-a-glance sense of address-book size without opening the modal |
| Contacts RLS policy | `for all` with **both** `using (owner_id = auth.uid())` and `with check (owner_id = auth.uid())` | The initial migration only had `using`, which silently blocked INSERTs (Postgres checks `using` against rows being read and `with check` against rows being written). Fixed with `alter policy ... with check (...)` after first insert failed |
| Adding contacts into groups | Activated (previously deferred) — `GroupDetail` shows a checkbox list of the user's contacts (excluding existing members) with a single "Add Selected (N)" button that batch-inserts `group_members` rows | Email input remains the primary entry path; the checkbox list is the secondary bulk path requested for "adding multiple users to the same group at one time" |
| New-group flow | Two-step: `CreateGroup` returns the new group, `GroupsPage` then auto-opens `GroupDetail` for it | Keeps a single source of truth for add-member logic in `GroupDetail`; avoids duplicating the staging/email/checkbox UI in `CreateGroup` |

## AI Auto-Tagging

| Feature | Decision | Reason |
|---|---|---|
| AI tags storage | Separate `media_ai_tags` table (no `user_id`) | Mirrors production pattern — AI-generated and user-generated tags are distinct data sources; separate table avoids an `is_ai` flag polluting `media_tags` |
| Tag generation timing | On new `/process-media` calls only | Existing media will be wiped when needed; no retroactive reprocessing pass required for now |
| Tag generation method | Single Gemini vision call returning JSON `{description, tags}` | Combines description + tags in one API call rather than two, using `responseMimeType: application/json` with a response schema |
| Tag count | 5–10 per photo | Instructed in prompt; model chooses based on content richness |
| UI placement | Read-only "AI Tags" section below "Your Tags" in MediaItem modal | Kept visually separate from user tags; no add/remove controls since AI tags are not user-editable |

---
