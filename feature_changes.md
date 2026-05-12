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
| Similarity threshold | 0.3 cosine similarity minimum | Filters out results that are semantically unrelated to the query; prevents noise in search results |
| Search scope | Global (all events) or per-event | `search_media` covers all events the user belongs to; `search_media_in_event` scopes to a single event; UI exposes both depending on context |
| Bulk upload | Deferred | Current uploader handles one file at a time; multi-file support to be revisited if time permits |

---
