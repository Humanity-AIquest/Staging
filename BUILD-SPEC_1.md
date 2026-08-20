# Humanity-AI.Quest — Build Spec for Claude Code

This document is a handoff brief. It describes how to turn the working front-end
prototype (`App.jsx`) into the real site, backend included, **without changing the
visual design** and **without breaking the existing HRC Agent chat**.

> **How to use this:** put `App.jsx` and this file in the repo (`Humanity-AIquest/Web`),
> open Claude Code in that repo, and start with: *"Read BUILD-SPEC.md and implement
> Phase 1."* You can also paste the "Project rules" section into a `CLAUDE.md` so it's
> always in context.

---

## Project rules (do not violate)

1. **Cosmetic design is frozen.** `App.jsx` is the source of truth for look and feel
   (the "Manifesto" design: navy `#08111E`, ivory text, coral `#FF5A36`, Fraunces
   serif display, mono eyebrows, the fixed connection-field background). Do not
   restyle. Only add behaviour and wiring.
2. **Preserve the existing chat.** The HRC Agent chat and its `functions/api/chat.js`
   already exist and must keep working. Mount the existing chat component inside the
   `ChatMount` component in `App.jsx` (replace the placeholder). Do not rebuild it.
3. **Replace dummy data with real data** at the points marked `WIRE BACKEND` in
   `App.jsx`. Every such spot also shows a small "⛭ Backend" tag in the UI.
4. **Stay on the current stack:** Cloudflare Pages + Vite + React + Cloudflare Pages
   Functions (free tier). Cloudflare Pages Functions must export
   `export async function onRequest(context)` — not a default export object.
5. **Keep it shippable on the free tier.** Prefer Cloudflare D1 (SQLite) for
   structured data and a single KV entry or a D1 count for the live signatory number.
6. **Shape relationship data as edges, not flat fields.** Wherever a table
   would store "who has what" or "who connects to whom" (skills, quest contributions,
   endorsements), use the generic `person_edges` table defined in "Future-phase
   readiness" below instead of ad-hoc columns. This costs nothing extra now and avoids
   a painful migration when Phase 3 (skills graph, gig scheduling, payments) is built.
   Do not build Phase 3 features yet — just don't foreclose them.

---

## Current state

- `App.jsx` — complete front-end prototype. All navigation works. The petition
  sign+share flow and the survey voting flow run client-side. Everything else uses
  in-file dummy arrays (`QUESTS`, `EVENTS`, `MEDIA`, `SURVEY`, `DRAFT_CLAUSES`) and
  alert() stubs marked `WIRE BACKEND`.
- The Founding Memo text lives in the editable `FOUNDING_MEMO` object at the top.
- `functions/api/chat.js` — existing HRC Agent backend (Anthropic API). Keep as-is.

---

## Routes / pages (front-end already built)

| Route (state `route.name`) | Page | Status | Needs backend |
|---|---|---|---|
| `home` | Landing + two doors + live counter | Built | live count (read) |
| `petition` | Founding Memo + sign + share | Built (client) | store signature, count |
| `community` | Hub linking to all sub-areas | Built | — |
| `quests` | List of open bounties | Built (dummy) | list quests |
| `quest` (`route.id`) | Quest detail + Q&A + register-to-pitch | Built (dummy) | detail, questions, pitch |
| `surveys` | pol.is-style statement voting | Built (client) | store votes, statements, results |
| `experts` | Draft clauses + agent feedback | Built | reuse existing chat |
| `events` | Events list + RSVP | Built (dummy) | list, rsvp |
| `media` | Podcasts/articles (placeholder) | Built (dummy) | optional CMS later |
| `courses` | Locked "post-funding" state | Built | none (static) |
| `agent` | Mounts existing chat | Seam ready | mount existing component |

---

## Data store

Use **Cloudflare D1** (one database, bound as `DB`). Suggested schema:

```sql
CREATE TABLE signatures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  side TEXT NOT NULL,              -- 'human' | 'developer'
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE quests (
  id TEXT PRIMARY KEY,            -- slug, e.g. 'plastic-to-fuel'
  title TEXT NOT NULL,
  bounty TEXT,                   -- display string, e.g. '$25,000'
  status TEXT DEFAULT 'Open',    -- 'Open' | 'Archived'
  summary TEXT,
  problem TEXT,
  tags TEXT,                     -- JSON array string
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE quest_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quest_id TEXT NOT NULL,
  author TEXT,
  question TEXT NOT NULL,
  answer TEXT,                   -- filled by admin
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE quest_pitches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quest_id TEXT NOT NULL,
  name TEXT, email TEXT, approach TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE surveys (
  id TEXT PRIMARY KEY,           -- slug
  title TEXT, intro TEXT,
  status TEXT DEFAULT 'open',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE survey_statements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  survey_id TEXT NOT NULL,
  text TEXT NOT NULL,
  author TEXT,                   -- null = seeded by admin
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE survey_votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  survey_id TEXT NOT NULL,
  statement_id INTEGER NOT NULL,
  value TEXT NOT NULL,           -- 'agree' | 'disagree' | 'pass'
  voter TEXT NOT NULL,           -- anonymous token (cookie), one vote per statement
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(statement_id, voter)
);

CREATE TABLE events (
  id TEXT PRIMARY KEY, title TEXT, when_text TEXT, type TEXT, blurb TEXT
);
CREATE TABLE event_rsvps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT, name TEXT, email TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
```

**One-person-one-vote (MVP):** issue an anonymous `voter` token via a first-party
cookie and enforce `UNIQUE(statement_id, voter)`. True personhood verification is a
separate future quest, not this build.

---

## SECTION: Future-phase readiness — skills, vouching, gig scheduling

**Do not build this now.** This section exists so Phase 1 tables don't have to be
redesigned when the platform later needs to know "who has what skills," support
peer vouching, and let developers schedule/get paid for gig-style contributions
(see project rule 6). Add this one table in Phase 1 alongside the others — it costs
nothing to include empty, and everything else in this section stays deferred.

**Why an edge table, briefly:** relationship-heavy questions ("who knows X and also
worked with Y") get slow and awkward as flat columns multiply. Storing every
relationship as a row — subject, relation, object — is the same idea a graph
database is built on, expressed in plain SQL. It stays fast at this project's scale
on D1, and if the platform ever outgrows D1 for this, the data already has the right
shape to move to a dedicated graph database (e.g. Neo4j) with minimal rework.

```sql
CREATE TABLE person_edges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id TEXT NOT NULL,        -- e.g. a signature id or future user id
  relation TEXT NOT NULL,          -- 'has_skill' | 'vouched_for' | 'contributed_to' | ...
  object_id TEXT NOT NULL,         -- a skill slug, another person's id, a quest id, etc.
  weight REAL,                     -- optional: confidence/strength (e.g. self-rated 1-5)
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_edges_subject ON person_edges(subject_id, relation);
CREATE INDEX idx_edges_object  ON person_edges(object_id, relation);
```

Examples of rows this supports later, with no schema change: a person *has_skill*
"rust"; a person *vouched_for* another person; a person *contributed_to* a quest;
a quest *needs_skill* "consent-architecture". Calendar/scheduling and payments for
gig-style work are a separate, ordinary relational concern (bookings, payouts
tables) — not graph-shaped — and are deferred to Phase 3 along with this table's
first real use.

Do **not** build profile pages, skill search, vouching UI, calendars, or payments
in Phase 1 or 2. Just create this table so it exists when that work starts.

---

## API endpoints (Cloudflare Pages Functions, under `/functions/api/`)

All handlers use `export async function onRequest(context)`. Return JSON. Add CORS
only if needed (same-origin, so usually not). Validate inputs; reject bad email.

### Petition
- `POST /api/sign` — body `{ name, email, side }` → `{ ok: true, number, count }`
  Insert signature, return that signatory's number (= row count) and total.
- `GET /api/count` → `{ count }` for the homepage and petition counter.

### Quests (public)
- `GET /api/quests` → `[{ id, title, bounty, status, summary, tags }]` (status='Open')
- `GET /api/quests/:id` → `{ ...quest, questions: [{ id, author, question, answer }] }`
- `POST /api/quests/:id/pitch` — `{ name, email, approach }` → `{ ok: true }`
- `POST /api/quests/:id/questions` — `{ author, question }` → `{ ok, id }`

### Quests (admin — see Admin auth below)
- `POST /api/admin/quests` — create `{ id, title, bounty, summary, problem, tags }`
- `PATCH /api/admin/quests/:id` — edit fields, set `status` to 'Archived'
- `DELETE /api/admin/quests/:id` — delete quest + its questions/pitches
- `POST /api/admin/quests/:id/questions/:qid/answer` — `{ answer }`

### Surveys (public)
- `GET /api/surveys/:id` → `{ id, title, intro, statements: [{ id, text }] }`
- `POST /api/surveys/:id/vote` — `{ statementId, value }` → `{ ok }` (sets cookie token)
- `POST /api/surveys/:id/statements` — `{ text }` → `{ ok, id }`
- `GET /api/surveys/:id/results` → `[{ statementId, text, agree, disagree, pass }]`
  (Phase 1 = simple per-statement tallies. Opinion **clustering** like pol.is — grouping
  voters by similar vote patterns — is Phase 2; do not attempt in Phase 1.)

### Surveys (admin)
- `POST /api/admin/surveys` — create survey + seed statements
- `PATCH /api/admin/surveys/:id` — edit/close

### Events
- `GET /api/events` → list
- `POST /api/events/:id/rsvp` — `{ name, email }` → `{ ok }`
- Admin: `POST /api/admin/events`

### Experts feedback → reuse existing chat
- The "Send to the agent" box on the Experts page should call the **existing**
  chat endpoint (`/api/chat`), not a new one. Pass the clause context + the user's
  message. Do not duplicate the agent.

---

## Admin auth (keep simple)

Solo operator, so don't build user accounts. Two acceptable options:

1. **Shared secret:** an `ADMIN_TOKEN` env var. All `/api/admin/*` handlers require a
   matching `Authorization: Bearer <token>` header. Build a minimal `/admin` page in
   the same design that stores the token in memory for the session and calls the admin
   endpoints. (Lowest effort.)
2. **Cloudflare Access** in front of the `/admin` route (no app code for auth). Cleaner
   if you have Access available.

Pick option 1 unless told otherwise.

---

## Front-end wiring tasks (in `App.jsx`)

Replace the dummy arrays and `alert()` stubs with `fetch()` calls. Specifically:

- `Home` / `Petition` counter → `GET /api/count`.
- `Petition.submit` (marked `WIRE BACKEND`) → `POST /api/sign`, then set the returned
  number into the existing success state.
- `Quests` → load from `GET /api/quests` (replace `QUESTS` constant usage).
- `QuestDetail` → `GET /api/quests/:id`; pitch + question forms → their POST endpoints;
  replace the `alert()` confirmations with real success/error UI in the same style.
- `Surveys` → load statements from `GET /api/surveys/:id`; each vote → `POST .../vote`;
  results view → `GET .../results`; "add statement" → `POST .../statements`.
- `Events` → `GET /api/events`; RSVP → POST.
- `Experts` feedback box → call existing `/api/chat`.
- `ChatMount` → render the existing HRC Agent component instead of the placeholder.

Keep all existing class names and markup; only swap data sources and handlers.

---

## Build phases (recommended order)

**Phase 1 — make the launch real (highest value):**
1. D1 setup + schema + seed the first survey and a few quests.
2. `POST /api/sign` + `GET /api/count`; wire the petition + counter.
3. Mount the existing chat into `ChatMount`.
4. Quests read endpoints + wire `Quests` and `QuestDetail` (read-only + pitch/question POST).
5. Surveys vote + statements + simple tally results; wire the survey page.

**Phase 2 — management + depth:**
6. Admin auth + admin endpoints (quests/surveys/events CRUD).
7. Events list + RSVP.
8. pol.is-style opinion clustering on survey results.
9. Media CMS (optional).

**Phase 3 — skills graph, gig scheduling, payments (not in this build):**
10. User accounts (replacing anonymous signatures) with skill/vouching data written
    into `person_edges` (see "Future-phase readiness" above).
11. Skill-based search — start with simple `person_edges` queries; add Cloudflare
    Vectorize for semantic matching once keyword/edge search proves insufficient.
12. Gig scheduling (calendar) and payment records — ordinary relational tables,
    not graph-shaped; design when this phase actually starts.

---

## Known issues / notes for the builder

- **Chat 502 (pre-existing):** if the agent returns 502, the usual cause is the
  Cloudflare Pages Function export pattern. Ensure `functions/api/chat.js` uses
  `export async function onRequest(context)` and reads the key from
  `context.env.ANTHROPIC_API_KEY`. This is separate from this build but worth checking
  while you're in there.
- **Free-tier logs:** Cloudflare free tier limits real-time function logs; rely on
  `wrangler pages dev` locally for debugging before deploying.
- **Privacy:** signatures store name + email. Add a one-line consent note (already in
  the UI: "Free. No spam.") and keep emails out of any public endpoint. Never return
  email addresses from public GET routes.

---

## Local dev & deploy

```bash
# install
npm install

# front-end only (mock API), fast iteration
npm run dev

# full stack with Functions + D1 locally
npx wrangler pages dev -- npm run build   # or your configured command

# create D1 + apply schema
npx wrangler d1 create humanity_ai
npx wrangler d1 execute humanity_ai --file=./schema.sql

# deploy: push to the connected GitHub repo; Cloudflare Pages builds automatically
```

Bind D1 and secrets in `wrangler.toml` / Pages project settings:

```toml
[[d1_databases]]
binding = "DB"
database_name = "humanity_ai"
database_id = "<from wrangler d1 create>"
```
Set `ADMIN_TOKEN` (and confirm `ANTHROPIC_API_KEY`) as Pages environment secrets.

---

## Definition of done (Phase 1)

- Visiting the site shows a real signatory count; signing increments it and persists.
- Quests and the first survey load from D1, not from in-file dummy data.
- Voting on the survey stores votes (one per statement per visitor) and results tally.
- The HRC Agent chat works from the `agent` page and the Experts feedback box.
- No visual change versus `App.jsx`. All `WIRE BACKEND` markers resolved or removed.
