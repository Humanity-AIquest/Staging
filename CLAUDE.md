# Humanity-AI.Quest

## What this is
The website **and backend** for **Humanity-AI.Quest** — the constitutional AI Operating System
governed by the **Humanities-AI Rights Constitution (HRC)**, described as the "Hippocratic Oath
for AI." The HRC is 52 clauses across 3 sections.

What began as a static React marketing site has grown a full backend: user accounts, a moderated
AI agent chat which remembers user context and interaction history, an idea "patent ledger," a petition, pol.is-style community surveys, innovation
quests, events, a CRM, a CMS, and an admin console — all on Cloudflare (Pages Functions + D1).

> **For the complete data model and API surface, see [`SCHEMA.md`](./SCHEMA.md).** That file is
> the ground-truth reference (24 D1 tables, ~35 endpoints, auth/ACL, integrations). Keep it in
> sync when you change the schema. This file is the orientation + intent doc; SCHEMA.md is the map.

---

## North star: the Agent IS the interface
The short-term goal is for the **constitutional Agent to become the primary UI to the site** —
not a chat widget bolted onto pages, but the front door. A person should be able to *talk to the
constitution*, and everything else (reading clauses, submitting ideas, voting, joining) should be
reachable through that conversation.

The Agent is a **constitutional agent** with three defining jobs:

1. **Memory.** It remembers each user's past conversations across sessions, it can search for similar ideas by
Other members and debate the difference. A returning member is
   greeted with continuity, not a blank slate — the agent can recall what they proposed, what they
   care about, and where their idea is in the pipeline. *(Data: `conversations` + `messages` keyed
   by `user_id`; `interactions` is the unified per-user activity index.)*

2. **Idea coalition.** As people converse, the agent helps them shape **ideas for the HRC** —
   proposed clauses, amendments, refinements. Ideas are captured, hashed into an immutable ledger,
   and moved through a review pipeline. Once an idea is **approved**, the agent *collates* related
   approved ideas rather than leaving them as scattered submissions. *(Data: `ideas` with
   `ledger_hash`/`prev_hash` chain + `clause_refs`; lifecycle in `idea_status_log`.)*

3. **Community voting.** The agent **presents approved ideas back to the community for a vote**,
   using the pol.is-style deliberation mechanism (agree / disagree / pass, one vote per person per
   statement). The community's signal is what decides whether an idea becomes a candidate clause.
   *(Data: `surveys` → `survey_statements` → `survey_votes`.)*

This closes a civic loop: **converse → propose → (admin) approve → collate → community vote →
clause.** When designing any feature, ask "does this route through the agent, feed its memory, or
move an idea along this loop?" The pages that exist today are the scaffolding; the agent is the
destination.

### Implications for how we build
- **Prefer the agent path.** New capabilities should be reachable through conversation, not only
  through a page. Pages remain as fallback/SEO/deep-links, but the agent is the intended entry.
- **Everything is remembered and attributable** (except deliberately anonymous survey votes).
  A "member" is keyed by lowercased email across signatures, pitches, RSVPs, and accounts.
- **The idea pipeline is real state, not a form.** Respect `status` transitions and always log to
  `idea_status_log`. "Approved" is the gate that lets an idea be collated and put to a vote.
- **Voting is sacred.** Preserve `UNIQUE(statement_id, voter)` — one person, one vote per
  statement.

---

## Stack
- **Frontend**: React 18, Vite, Lucide React icons. Almost all public UI is in `src/App.jsx`;
  the admin console is `src/AdminDashboard.jsx`.
- **Styling**: CSS-in-JS via a `<style>` tag / CSS custom properties (`var(--aurora)`, etc.).
  A Tailwind config exists but the app is CSS-vars-first — no Tailwind classes in the UI.
- **Fonts**: Fraunces (display serif), Manrope (body sans-serif) via Google Fonts.
- **Backend**: Cloudflare **Pages Functions** under `functions/api/**` (file-based routing) — true
  for this (Web) repo. **The Staging repo is a different Cloudflare product (a Worker) and routes
  these same files manually — see "Deployment environments" below before assuming Pages semantics
  apply everywhere.**
- **Database**: Cloudflare **D1** (SQLite), bound as `env.DB`. Schema self-migrates on first use.
- **AI**: Anthropic Messages API, called **server-side only** from `functions/api/chat.js`.
  Model constant `claude-sonnet-4-6`, `max_tokens: 2000`. The API key never reaches the browser.
- **Email**: Zoho ZeptoMail HTTP API (`functions/api/_email.js`) — guarded, no-ops until secrets set.
- **CRM**: Zoho CRM leads (`functions/api/_zoho.js`) — guarded, no-ops until secrets set.
- **Hosting**: Cloudflare Pages (free tier). **Domain**: humanity-ai.quest

## Project structure
```
humanity-ai-quest/
├── functions/api/
│   ├── chat.js                 ← Agent proxy: guardrails, memory, Anthropic call
│   ├── _shared.js              ← CORS, JSON, password hashing, getUser, requireACL, newId
│   ├── _conversations.js       ← conversations/messages/interactions schema + logInteraction
│   ├── _movement.js            ← petition/quests/surveys/events schema + seed data
│   ├── _email.js  _zoho.js     ← ZeptoMail + Zoho CRM integrations (guarded)
│   ├── auth/                   ← signup, login, logout, me
│   ├── ideas.js  sign.js  count.js  content.js
│   ├── quests/  surveys/  events/   ← public movement endpoints
│   └── admin/                  ← ACL-gated console API (members, conversations, ideas, …)
├── src/
│   ├── App.jsx                 ← Public site: 10 pages + HRC explorer + HRCAgent chat
│   ├── AdminDashboard.jsx      ← Admin console (consumes /api/admin/*)
│   ├── useTTS.jsx              ← Agent text-to-speech
│   └── main.jsx                ← Entry point
├── SCHEMA.md                   ← Full DB + API reference (source of truth)
├── CLAUDE.md                   ← This file (orientation + intent)
├── index.html · package.json · vite.config.js
```

## Architecture decisions
- **Self-migrating schema.** There is **no `.sql` migration file**. Tables are created via
  `CREATE TABLE IF NOT EXISTS` and columns via idempotent `ALTER TABLE … ADD COLUMN` in try/catch.
  Canonical DDL modules: `_movement.js` and `_conversations.js`. When you add a table/column, do it
  the same way (idempotent, on first request) **and update `SCHEMA.md`**.
- **`users` and `sessions` self-migrate via `ensureAuthSchema(env)`** in `_shared.js` (called at the
  top of `auth/login.js`, `auth/signup.js`, `auth/me.js`), same idempotent
  `CREATE TABLE IF NOT EXISTS` pattern as `_movement.js`/`_email.js`. (This function was missing
  entirely until 2026-09 — a real bug that silently broke all three auth endpoints; if you see it
  missing again, check whether an old file version got reintroduced.)
- **Errors return HTTP 200** with an `{ error }` body by design, so the frontend always parses.
- **No enforced foreign keys.** Relationships are by convention (see the map in SCHEMA.md).
  `interactions` and `admin_actions` are polymorphic pointer/audit logs.
- **Single-file front end (for now).** The public site lives in `src/App.jsx` — intentional for
  the MVP: simple and greppable. As it grows, split into `src/pages/`, `src/components/`, `src/data/`.
- **No localStorage.** Front-end state is in-memory React; persistence is the D1 backend.

## Authentication & ACL
- Salted **SHA-256** passwords via Web Crypto (`hashPassword`/`verifyPassword`).
- 30-day sessions: 64-hex token in the `hrc_session` cookie or `Authorization: Bearer`.
- **ACL levels** (`acl_level`, only meaningful when `role === 'admin'`): 0 user · 1 viewer ·
  2 moderator · 3 editor · 4 manager · 5 super admin. `requireACL(user, min)` enforces
  **`role === 'admin' && acl_level >= min`** — the `&&` matters (a prior `||` bug let any admin
  escalate; keep it `&&`).

## Key color palette
- `--void`: #07101F (deep space background)
- `--bone`: #F2EAD3 (primary text)
- `--aurora`: #5BE9DD (primary accent — cyan)
- `--gold`: #E8B14F (secondary accent)
- `--terra`: #C97B5B (tertiary accent)
- `--forest`: #1B3B2F (earth green)
- `--cosmos`: #131F32 (section backgrounds)

## HRC data
All 52 clauses are stored as three arrays at the top of `src/App.jsx`, which must be editable via the Admin CMS page:
- `HRC_CORE` — 33 Core Rights & Protections (Section I)
- `HRC_GOV` — 10 Governance & Evolution (Section II)
- `HRC_OPS` — 9 Operational Mandates (Section III)

Each clause is `{ n: number, t: title, s: summary, r: reasoning }`. The community-voting loop is
how *new* clauses are meant to enter this set — approved ideas become candidate clauses put to a vote.

## The HRC Agent
- Chat UI component `HRCAgent` in `src/App.jsx`; TTS via `src/useTTS.jsx`.
- Calls `/api/chat` (the Cloudflare Function `functions/api/chat.js`), which:
  1. runs **input guardrails** (DB `guardrail_rules` if present, else hardcoded fallback) —
     blocked messages are still logged, flagged, and answered with a dignity-grounded refusal;
  2. builds the system prompt via `buildSystemPrompt()` — embeds all 52 clauses; the agent is
     in-character as the conversational embodiment of the constitution;
  3. reuses the client-supplied `conversation_id` so multi-turn chats stay one thread (**this is
     the memory primitive** — build on it toward true cross-session recall);
  4. calls Anthropic and **persists both turns** to `messages`, then appends to `interactions`.
- **Toward the north star:** memory today is per-thread; the goal is per-user recall across
  sessions, agent-driven idea capture, and agent-surfaced approved ideas for voting.

## Pages (10 total)
`home` · `constitution` (interactive 52-clause explorer) · `quest` (pitch competition) ·
`agent` (Your Personal Agent explainer) · `os` (the OS architecture) · `community` ·
`ledger` (Humanity's patent ledger) · `manifesto` (+ pledge) · `join` (three-door onboarding) ·
`about`. Treat these as scaffolding around the agent, not the product's ceiling.

## Design principles
- **Tone**: Civilizational, warm, manifesto-grade. Never corporate. Never AI-hype.
- **Visual**: Organic-futurist meets cinematic sci-fi. Biomorphic forms, aurora light,
  planetary nervous system.
- **Forbidden words**: disrupt, revolutionize, game-changer, supercharge, unleash, next-gen
- **Preferred words**: constitution, sovereignty, gift, commons, lineage, dignity, partnership,
  ledger, oath, planet, peace, truth, biodiversity, agent, quest, humanity

## Commands
```bash
npm install       # Install dependencies
npm run dev       # Dev server at localhost:5173
npm run build     # Production build to dist/
```

## Deployment environments — two separate repos, two different architectures

**This project deploys from TWO separate GitHub repos, not two branches of one repo.**
Uploading/pushing to the wrong one has caused real outages — read this before touching either.

| | **Web** (production) | **Staging** |
|---|---|---|
| Repo | `Humanity-AIquest/Web` | `Humanity-AIquest/Staging` (separate repo!) |
| Branch | `main` | `main` |
| URL | https://humanity-ai.quest | https://staging.humanity-ai-info.workers.dev |
| Cloudflare product | Classic **Pages** project | Genuine **Worker** (despite living under the "Workers & Pages" dashboard section — confirmed by the `.workers.dev` URL pattern and `wrangler pages deploy` reporting "Project not found" when tried) |
| `functions/api/*.js` routing | **Automatic** — Pages auto-generates the router from the file tree | **Manual** — `src/index.js` is a hand-written router that imports every handler and dispatches by path. **If you add/rename/move a file under `functions/api/`, you must also update `src/index.js` on Staging**, or the new route silently 404s. Web needs no such update. |
| Config file | none committed (D1 binding set via Cloudflare dashboard) | `wrangler.jsonc` (committed) — `main`, `assets` block, `d1_databases`, `kv_namespaces` |
| Deploy command (Cloudflare dashboard → Settings → Build configuration) | n/a (Pages auto-deploys after build) | `npx wrangler deploy` — **must** be this, not `wrangler deploy` alone (fails: "Missing entry-point" before `main`/`assets` existed) and not `wrangler pages deploy` (fails: "Project not found" — this is not a Pages project) |
| D1 binding name in code | `env.DB` | `env.DB` (same name deliberately — code is meant to be near-identical between repos) pointing to the separate `humanity-ai-db-staging` database |

**Recurring failure mode to watch for:** code has repeatedly gotten cross-contaminated between
these repos — e.g. a local-dev-only `wrangler.toml` from the Web repo's gitignored file, or a
one-off binding rename, ending up committed to Staging via a manual "Add files via upload." If a
function suddenly throws `Cannot read properties of undefined (reading 'prepare')`, grep the repo
you're in for a binding name that doesn't match its own `wrangler.jsonc`/dashboard config before
assuming it's a code bug.

**Staging's `CLOUDFLARE_API_TOKEN`** (used by the build to run `wrangler deploy`, set as an
environment variable on the Staging Cloudflare project) **expires 2027-09-01.** Cloudflare tokens
can't be edited once expired — the fix is "roll" (regenerate) it from
dash.cloudflare.com/profile/api-tokens *before* it expires, not after. If Staging deploys start
failing with `Authentication error [code: 10000]`, this is the first thing to check.

- Push to `main` on **Web** auto-deploys via Cloudflare Pages. Build command `npm run build`, output dir `dist`.
- Secrets (Cloudflare dashboard, encrypted env vars, set separately per project): `ANTHROPIC_API_KEY`
  (required for the agent); `ZEPTOMAIL_TOKEN` / `EMAIL_FROM` / `EMAIL_FROM_NAME` (email); `ZOHO_*`
  (CRM). Missing integration secrets fail safe — the app keeps working, those features just no-op.
- `DB` is the D1 binding on both Web and Staging.

## Important notes
- The HRC Agent calls `/api/chat`, **not** Anthropic directly — the proxy adds the API key server-side.
- **Update `SCHEMA.md` whenever you change the database or API.** Regenerate its map by grepping the
  Functions for `CREATE TABLE`, `ALTER TABLE`, and `env.DB.prepare(`.
- Seed/mock data exists (3 quests, 2 surveys, 3 events, default email templates) — replace with real
  data as the movement grows.
- The newest clause is I.33 "Right to Truthful Media & Pro-Humanity Content" (cross-refs I.4, I.12, II.4).


