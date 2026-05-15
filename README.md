# Kithly — Lost Memories, Forever Found

## Overview

### Problem
Most people have group chats with family and friends that are used for anything from daily communication to event planning, sharing of holiday photos, and cleaning the kitchen sink. And one fine day, when you want to look back on some past memories, or share that photo of when you climbed a volcano with your mother, you have to scroll through a million years worth of chat and media history carefully making sure that you have not scrolled past the time period of the event. 

Well, asuming you have not changed phones and wiped that image completely from your chat history already, it's probably there somewhere...

#### Problem Statement
How might we help people **find lost moments** in a vast sea of communication **easily and conveniently**? 

#### Solution: Kithly - A System of Records for Personal Moments
Kithly is a prototype of a private, event-organised photo and video sharing platform with AI-powered semantic search. 

### Outcome
Within the prototype:

- Multi-user authentication and access control using Supabase Auth and row-level security policies.
- Event-scoped photo and video sharing with invite-based membership and admin/member roles.
- AI pipeline that generates a natural-language description and semantic tags for each uploaded photo using Gemini Vision, embeds the result as a 3072-dimension vector, and stores it in Postgres via pgvector.
- Natural-language photo search (e.g. "sunny outdoor moment", "group dinner") across all events a user belongs to, or scoped to a single event
- Memory feed showing a user's events' media in one grouped, chronological view
- Contacts address book and group management to support bulk event invitations

<br>

Features Wanted but Not Implemented:

- Email verification upon sign up
- Communication and message log between event participants
- AI pipeline that generates milestones, task lists, and reminders for event participants.
- Push notifications
- Mobile native build with React Native

<br>

## Demo

The main user flow from start to finish:

1. **Sign up / sign in** — create an account with your name and email. A user record is created automatically in the database via a Postgres trigger on signup.

2. **Create an event** — give it a name, set start and end dates, and optionally add a location. You are set as the event admin.

3. **Invite members** — admins can invite other registered Kithly users by email. Invited users immediately gain access to the event.

4. **Upload photos and videos** — any event member can upload media. Photos have EXIF metadata (date taken, GPS coordinates) extracted automatically on upload. After each photo upload, the AI pipeline runs in the background: Gemini Vision analyses the image and returns a description and tags; these are embedded as a 3072-dimension vector and stored for search.

5. **Search by natural language** — type a query like "laughing at the beach" or "birthday cake" into the search bar. The query is embedded using the same model and the closest-matching photos are returned via pgvector cosine similarity.

6. **Browse the memory feed** — the Feed page shows all media across your events, grouped by event and ordered from most recent. Click any photo to open the detail view, add tags, favourite it, or comment.

7. **Manage contacts and groups** — the Groups page is the hub for people. Add contacts by email, organise them into named groups, and use the checkbox list to batch-add contacts to a new or existing group.

<br>

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 18.3 | Component-based UI framework |
| Vite | 7 | Build tool and dev server |
| react-router-dom | 7 | Client-side routing (SPA) |
| styled-components | 6 | CSS-in-JS component styling |
| lucide-react | latest | Icon library |
| exifr | 7 | EXIF metadata extraction from photos (date, GPS) |
| @supabase/supabase-js | 2 | Supabase client for auth, database queries, and storage |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| Node.js | 20 | JavaScript runtime |
| Express | 5 | HTTP server for the AI processing API |
| Supabase | — | Managed Postgres database, Auth, and file Storage |
| pgvector | — | Postgres extension for storing and querying embedding vectors |
| @google/genai | 2 | Google Gemini API SDK |
| Gemini Vision (`gemini-2.5-flash-lite`) | — | Analyses uploaded photos; returns a natural-language description and AI-generated tags |
| Gemini Embeddings (`gemini-embedding-001`) | — | Converts photo descriptions and metadata into 3072-dimension semantic vectors |
| dotenv | — | Environment variable loading for the Express server |
| cors | — | Cross-origin request handling between frontend (port 5173) and AI server (port 3001) |

<br>

**Database** 

Supabase Postgres with 11 tables 
- `users` 
- `events`
- `event_members`
- `media`
- `media_tags`
- `media_ai_tags`
- `media_favourites`
- `media_embeddings`
- `media_comments`
- `groups`
- `group_members`
- `contacts`

Row-level security on all tables, and two Postgres triggers (auth user sync on signup, event creator auto-promoted to admin on event creation).

---

## Development Approach with AI

### AI Tools and Services

| Tool | Role |
|---|---|
| **Claude Code** (Anthropic) | Primary co-developer throughout the entire build — schema design, component scaffolding, debugging, and architecture decisions |
| **Gemini Vision** (`gemini-2.5-flash-lite` / `gemini-2.5-flash` fallback) | Analyses each uploaded photo at processing time and returns a structured JSON response containing a 2–3 sentence description and 5–10 semantic tags |
| **Gemini Embeddings** (`gemini-embedding-001`) | Converts the concatenated photo description, caption, user tags, and event metadata into a 3072-dimension vector for pgvector storage and cosine similarity search |

### AI Agents

| Agent | Role and Skills |
|---|---|
| Claude Code | Sole AI agent. <br><br> Responsibilities spanned the full stack: database schema design and migration authoring, Supabase RLS policy authoring, React component building, Express server authoring, debugging production errors (RLS gaps, pgvector incompatibilities, Gemini API model availability) <br><br> Architectural decision-making when the developer deferred to AI judgement on unfamiliar topics (embedding pipeline design) |

### Co-Developing with AI Approach

| Phase | User Approach | AI Dev | Next Step |
|---|---|---|---|
| **Planning** | Shared a written brief; explicitly flagged unfamiliar topics (AI embedding) and handed those decisions to AI judgment <br><br> Set up a logging convention to record AI judgment calls for later review | Asked clarifying questions to resolve ambiguities in the brief; proposed the embedding architecture for the domain the user flagged as unfamiliar; <br><br> Logged deferred decisions explicitly | Schema design |
| **Schema Design** | Provided key data model relatiosnips and answered AI's clarifying questions on scope and constraints; <br><br> Retroactively challenged completeness rather than waiting for gaps to surface at runtime | Translated requirements into a full 11-table schema with RLS policies, indexes, and Postgres triggers; <br><br> Surfaced missing table (`media_favourites`) when prompted to review; <br><br> Explained each design decision in plain language | Database deployment |
| **Database Deployment & Schema Fixes** | Reported outcomes and error messages as they came up; | Diagnosed a Postgres constraint that blocked set-returning functions in RLS expressions; <br><br> Fixed by changing the function's return type; confirmed the migration was live | Auth & app scaffolding |
| **Auth & App Scaffolding** | Minimal directive; <br><br> Allowed AI to make scaffolding decisions and boilerplate generation | Scaffolded Vite + React, Supabase client singleton, and auth context; <br><br> Caught and fixed an env prefix mismatch | Events & groups UI |
| **Events & Groups UI** | Provided page names and user flows; Directed AI to build routing, components, and interaction patterns | Built all event and group pages and components; made routing and layout decisions; <br><br> Surfaced the design choices that needed user input | Media upload pipeline |
| **Media Upload Pipeline** | Manually created storage buckets on Supabase; <br><br> Reported browser errors through manual testing and let AI debug rather than prescribing fixes | Wired in storage bucket, EXIF extraction, built upload component, media grid, and media detail modal; <br><br> Fixed three RLS and query bugs surfaced during testing without additional prompting | AI pipeline |
| **AI Pipeline** | Minimal directive; Explicitly flagged as unfamiliar domain; <br><br> Confirmed the AI-proposed architecture with clarification; <br><br> Discussed model fallback chain to ensure AI pipeline runs smoothly | Designed and implemented the full pipeline: <br><br> Express server, Vision → description → embedding → pgvector → cosine search; <br><br> Proposed fire-and-forget processing to keep upload UX non-blocking; <br><br> Built a fallback model chain after testing exposed model instability | Embedding tuning |
| **Embedding Tuning** | Discussed embedding tuning tradeoffs before committing to any changes; <br><br> Made a directional call after understanding the reasoning; <br><br> Reported errors during reprocessing without diagnosing them | Explained dimension tradeoffs; <br><br> Handled the migration, HNSW index removal, reprocessing pass, and a UUID parse bug in the bulk endpoint; <br><br> Surfaced each downstream consequence of the dimension change proactively | Memory feed |
| **Memory Feed** | Discussed layout options with style preferences; | Proposed three layout options (flat chronological, grouped by event, grouped by date) and recommended one with rationale; <br><br> Built the confirmed layout as a new route reusing existing components | Contacts & group invites |
| **Contacts & Group Invites** | Multi-part review that raised several UX gaps; <br><br> Specified exact interaction design for complex flows (checkbox list, batch add, two-step group creation) with enough detail to implement without back-and-forth | Fixed the RLS `with_check` gap silently blocking all INSERTs; <br><br> Implemented soft delete with restore-on-re-add; built the checkbox contact list and batch-add flow; flagged one design ambiguity (single vs two-step modal) and implemented the confirmed choice | Frontend styling & polish |
| **Frontend Styling & Polish** | Specified visual requirements at the component and property level; <br><br> Directed changes with concrete expected outcomes rather than general aesthetic direction | Implemented per-component styling changes; <br><br> Restructured card layouts to accommodate new elements (cover photos, date row, chevron alignment); <br><br> Ensured new patterns were consistent across pages | Documentation & wrap-up |

### Key Prompts

The following prompts, drawn from the development log, represent the most significant decision points in the build.

**1. Schema completeness review**
> *"are you sure the schema design is complete? i remember us talking about having user interaction with the uploaded media, but the engagement is not in the schema"*

Rather than accepting the schema output at face value, the prompt actively challenged it by referencing context from earlier in the conversation. The question was framed as a self-audit invitation rather than a directive — Asking "are you sure" rather than "add X" avoided anchoring the AI on a specific fix and left it to find the gap itself. If told that X is missing when it is not, the agent may hallucinate and create issues that did not exist beforehand. 

**2. Deferring to AI on an unfamiliar domain**
> *"i am not certain about how embedding works, use your best judgement. also, make sure to make a note of this in the feature changes document and prompt log, that i am deferring to AI judgement for a topic that i do not have much knowledge about"*

The prompt explicitly declared the knowledge gap rather than concealing it. Stating "use your best judgement" gave the AI clear license to decide without the constraint of half-formed developer preferences. The instruction to log the deferral served two purposes: it created an audit trail of decisions made without full developer understanding, and it treated the handoff as something reviewable later rather than a decision taken on implicit trust.

**3. Embedding dimension decision**
> *"remind me again why we switched to the 768 embedding? and does that mean that only with large amounts of data within the actual database will this become more accurate?" / "yes bump it to 3072"*

Rather than accepting the existing parameter or changing it without understanding the tradeoff, the prompt asked for the reasoning behind a prior decision before committing to a new one. This pattern — request explanation, then decide — was used deliberately for a technical parameter that wasn't fully understood when it was first set. The follow-up "yes bump it to 3072" was an informed choice rather than another deferred judgment call.

**4. Spec gap audit**
> *"what is the next step or phase left to implement, disregard styling for now"*

Rather than specifying what to build next, the prompt asked the AI to audit remaining gaps against the original spec. The AI had full context of both the brief and the current build state, making it better positioned to identify what feature gaps remained. The "disregard styling" constraint was deliberate: Without it, the audit would have mixed functional gaps with visual polish and produced a noisier, less actionable response. The choice of what to work on first was then made based on the AI's assessment.

**5. Contacts UX review**
> *"1 - is the remove contact a hard delete or soft delete? 2 - users should be able to add a new contact directly from the groups page instead of needing to open the view all contacts card. 3 - what else have we missed out"*

The numbered structure served two purposes: it forced each concern to be articulated clearly before prompting, and it signalled to the AI that these were separate items to address individually rather than a combined request. The first two items were explicit observations; the third was deliberately open-ended to invite the AI to extend the review beyond what had already been noticed. Mixing specific directives with an open-ended audit question in the same prompt kept the interaction efficient and self-auditing throughout the process.

**6. Group invite from contacts**
> *"when a user creates a new group or wants to add members to a group in their groups list, the text bar that allows users to type in the contact email should still be there at the top of the modal as a primary option. but the user's contact list should render with checkboxes next to them to indicate that the user wants to add them to the group. then there should be a button to allow for adding multiple users to the same group at one time."*

This prompt specified the exact interaction because the desired UX was clear. The phrase "should still be there" explicitly told the AI to extend the existing email-input pattern rather than replace it — a constraint that would not have been inferred from a high-level description. The level of detail was intentional: enough for the AI to implement directly without needing to propose design alternatives first, but framed in terms of user interaction rather than implementation mechanics.

### Key Review Points and Decisions

| Review Point | Decision Made |
|---|---|
| Embedding architecture (unfamiliar domain) | Deferred to AI: vision description + user tags/caption + event metadata → single concatenated text → one embedding per photo. Rationale: simpler schema, no index management per data source, sufficient for a prototype |
| Embedding dimensions: 768 vs 3072 | Upgraded to 3072 after understanding that higher dimensions capture more semantic nuance. Accepted the tradeoff of larger storage and longer embed time |
| pgvector HNSW index | Dropped entirely. pgvector's HNSW index supports a maximum of 2000 dimensions; 3072 exceeds this. Exact sequential scan used instead — acceptable performance for a small prototype dataset |
| Gemini model selection | Settled on `gemini-2.5-flash-lite` (primary) + `gemini-2.5-flash` (fallback) after testing showed `gemini-1.5-flash` was unavailable on v1beta, `gemini-2.0-flash` was deprecated, and `gemini-2.5-flash` returned 503 errors under load |
| Contacts remove: hard delete vs soft delete | Changed to soft delete (set `deleted_at`) to match the rest of the codebase and preserve address book history |
| Re-adding a removed contact | Instead of failing on the unique constraint, the soft-deleted row is restored (clear `deleted_at`) on duplicate key. Keeps `created_at` history continuous |
| New-group creation flow | Two-step: create group → auto-open the existing `GroupDetail` modal for member management. Keeps all add-member logic in one place rather than duplicating it in the creation form |
| RLS `with check` gap | The contacts INSERT policy was missing a `with check` clause — Postgres checks `using` against rows being read and `with check` against rows being written. Without `with_check`, all INSERTs were silently denied. Fixed with `ALTER POLICY ... WITH CHECK (owner_id = auth.uid())` |

---

## Installation

### Prerequisites

- Node.js v20 or later (install via [nvm](https://github.com/nvm-sh/nvm): `nvm install 20 && nvm use 20`)
- A [Supabase](https://supabase.com) project with the **pgvector** extension enabled (`Database > Extensions > vector`)
- A [Google AI Studio](https://aistudio.google.com) API key with access to `gemini-2.5-flash-lite` and `gemini-embedding-001`

### Steps

**1. Clone the repository**
```bash
git clone https://github.com/chllee/kithly.git
cd kithly
```

**2. Install frontend dependencies**
```bash
npm install
```

**3. Configure frontend environment**
```bash
cp .env.example .env
```
Open `.env` and fill in your Supabase project URL and anon key (found under **Settings > API** in the Supabase dashboard).

**4. Install AI server dependencies**
```bash
cd server && npm install && cd ..
```

**5. Configure AI server environment**
```bash
cp server/.env.example server/.env
```
Open `server/.env` and fill in your Supabase URL, service role key, and Gemini API key.

**6. Apply the database schema**

Open your Supabase project, navigate to **SQL Editor**, paste the contents of `supabase/migrations/master_schema.sql`, and run. This creates all tables, indexes, RLS policies, and triggers.

**7. Start the AI server**
```bash
cd server && npm start
```
The server starts on `http://localhost:3001`.

**8. Start the frontend dev server** (in a separate terminal)
```bash
npm run dev
```
The app is available at `http://localhost:5173`.

---

## Usage

| Action | How |
|---|---|
| **Sign up** | Visit the app, click Sign Up, enter your name, email, and password |
| **Create an event** | From the Events page, click New Event, fill in the name, dates, and optional location |
| **Invite a member** | Inside an event (as an admin), enter a registered user's email in the invite form |
| **Upload media** | Inside an event, use the upload area to select a photo or video. AI processing runs in the background after each photo upload |
| **Search photos** | Use the search bar on the Events page (searches all your events) or inside a single event (scoped search). Type a natural-language query, e.g. "smiling outdoors" |
| **View and interact** | Click any photo in a grid or the feed to open the detail view. You can favourite it, add/remove your own tags, and read or write comments |
| **Browse the feed** | Navigate to Feed in the top nav to see all your events' media grouped by event, newest first |
| **Manage contacts** | Go to Groups. Click "All My Contacts" to view, add, or remove contacts by email |
| **Create a group** | On the Groups page, click Add New Group, name the group, then add members via email or by selecting from your contacts list |
| **Reprocess embeddings** | If needed, call `POST http://localhost:3001/reprocess-all` to regenerate embeddings for any unprocessed photos |

---

## Project Structure

```
kithly/
├── README.md
├── .env.example              # frontend environment variable template
├── .gitignore
├── package.json
├── vite.config.js
├── index.html
│
├── src/                      # React frontend source
│   ├── main.jsx              # app entry point
│   ├── App.jsx               # routing and auth gate
│   ├── theme.js              # design tokens (colours, spacing, typography)
│   ├── lib/
│   │   └── supabase.js       # Supabase client singleton
│   ├── contexts/
│   │   └── AuthContext.jsx   # session state via onAuthStateChange
│   ├── components/           # shared UI components
│   │   ├── Nav.jsx           # top navigation bar
│   │   ├── SearchBar.jsx     # natural-language search (calls Express /search)
│   │   ├── MediaGrid.jsx     # 3-column media grid with signed URL loading
│   │   ├── MediaItem.jsx     # lightbox modal with favourites, tags, comments
│   │   ├── MediaUpload.jsx   # file picker with EXIF extraction and upload
│   │   ├── GroupDetail.jsx   # group member management modal
│   │   ├── CreateGroup.jsx   # new group creation form
│   │   ├── InviteMember.jsx  # event member invite by email
│   │   └── ui.jsx            # styled-components primitives (buttons, inputs, cards)
│   └── pages/
│       ├── FeedPage.jsx      # memory feed grouped by event
│       ├── EventsPage.jsx    # events list with global search bar
│       ├── EventPage.jsx     # single event detail, upload, and per-event search
│       ├── CreateEventPage.jsx
│       ├── GroupsPage.jsx    # groups and contacts hub
│       ├── SignIn.jsx
│       └── SignUp.jsx
│
├── server/                   # Express AI backend (port 3001)
│   ├── index.js              # /process-media, /reprocess-all, /search endpoints
│   ├── .env.example          # server environment variable template
│   └── package.json
│
├── supabase/
│   └── migrations/           # SQL migration files
│       ├── master_schema.sql # combined schema for clean deployment
│       └── *.sql             # individual incremental migration files
│
└── test_assets/              # sample photos used during development and search testing
```

---

## Reflection

### What Went Well

**AI-first schema design.** Having Claude generate the full database schema — 11 tables, row-level security policies, indexes, and Postgres triggers — before any frontend code was written meant the data model was solid from the start. Bugs caught during schema review (a missing `media_favourites` table, incorrect RLS policy structure) were caught in SQL rather than in React component state, which is a much cheaper place to fix them.

**Deferring unfamiliar architecture to the AI.** The embedding pipeline (vision model → text description → concatenation with metadata → embedding model → pgvector storage → cosine similarity search) was entirely new territory. Rather than spending time learning the space from scratch, I described the goal, asked the AI to recommend and implement an approach, and reviewed the reasoning. The result — a working semantic search on photo content — was shipped in one session. The deference was explicitly logged so it could be reflected on and questioned later.

**Debugging in conversation.** Production-style bugs (a silent RLS INSERT denial, a UUID-parse error from passing SQL as a string, pgvector dimension limits, Gemini model deprecations) were diagnosed through iterative back-and-forth rather than documentation searches. The AI could hold all the context of what was already built and identify the root cause precisely.

### What Could Have Been Better

**RLS `with check` omission.** <br>
The contacts table INSERT policy was written with only a `using` clause. Postgres uses `using` to filter rows being read, and `with check` to gate rows being written — without `with_check`, all INSERT operations were silently denied. The bug only surfaced at runtime and required inspecting the `pg_policies` system view to diagnose. The fix was a single `ALTER POLICY` statement, but the diagnostic cost was high relative to how simple the root cause was.

**Gemini model availability.** <br>
Several model names tried during development were either deprecated, unavailable to new API users, or returning 503 overload errors under normal load. `gemini-1.5-flash`, `gemini-2.0-flash`, and `gemini-2.0-flash-lite` were all tried and dropped before settling on `gemini-2.5-flash-lite` with a `gemini-2.5-flash` fallback. The AI mitigated this by building a fallback chain, but the initial debugging cost was non-trivial.

**pgvector HNSW index incompatibility.** <br>
After upgrading embedding dimensions to 3072, the HNSW index (which had been created for faster approximate nearest-neighbour search) had to be dropped entirely — pgvector's HNSW index supports a maximum of 2000 dimensions. Exact sequential scan is used instead, which is acceptable for a small prototype dataset but would not scale.

**Embedding pipeline bug in bulk reprocessing.** <br>
The `/reprocess-all` endpoint initially passed a raw SQL subquery string (`"(select media_id from media_embeddings)"`) to the Supabase JS `.not()` filter, which interpreted it as a literal UUID and threw a parse error. The fix was to fetch existing IDs into a JavaScript array first and filter from that. The error was immediately obvious from the error message, but it highlighted a gap in understanding how the Supabase JS client handles filters differently from raw SQL.

### Key Changes Made and Rationale

| Change | Rationale |
|---|---|
| Embedding dimensions: 768 → 3072 | Higher dimensions capture more semantic nuance; 3072 is the model maximum. Chosen after understanding the tradeoff |
| Dropped HNSW vector index | pgvector HNSW max is 2000 dims; 3072 exceeds this. Sequential scan is adequate at prototype scale |
| Model selection narrowed to flash-lite + flash fallback | Most other Gemini model names tried were deprecated or unavailable; fallback chain adds resilience at minimal cost |
| Contacts remove: hard delete → soft delete | Consistency with the rest of the codebase; preserves history; allows re-add without violating the unique constraint |
| Re-add removed contact: insert → restore | Soft-deleted row already exists; clearing `deleted_at` preserves the original `created_at` and avoids a unique constraint violation on re-add |
| New-group flow: single modal → two-step | Keeping all add-member logic in `GroupDetail` avoids duplicating the email + checkbox UI in `CreateGroup`; one source of truth for member management |
