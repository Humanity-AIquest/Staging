# Humanity-AI.Quest — Database & Platform Schema

> **Purpose of this document.** A single-file, ground-truth reference to everything that has
> been built — the data model, the API surface, the auth/ACL system, external integrations,
> and the frontend. Paste this into a fresh chat session to give it the full picture without
> re-reading the code.
>
> **Last mapped from source:** branch `claude/humanity-ai-quest-schema-ytnwda`.
> This is reverse-engineered from the live code (the Cloudflare Functions), not from a
> hand-maintained migration file — see [§8 Caveats](#8-caveats--source-of-truth).

---

## 1. Platform at a glance

**Humanity-AI.Quest** is the website + backend for a constitutional "AI Operating System"
governed by the **Humanities-AI Rights Constitution (HRC)** — 52 clauses across 3 sections.
What began as a static single-page marketing site (`src/App.jsx`) has grown a full backend:
accounts, an AI agent chat with moderation, an idea/"patent ledger", a petition, pol.is-style
surveys, innovation quests, events, a CRM, a CMS, and an admin dashboard.

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + Vite SPA. Almost all UI lives in `src/App.jsx`; the admin console is `src/AdminDashboard.jsx`. TTS helper in `src/useTTS.jsx`. |
| **Styling** | CSS-in-JS via a `<style>` tag / CSS custom properties (`--void`, `--aurora`, …). Tailwind config exists but the app is CSS-vars-first. |
| **Backend** | Cloudflare **Pages Functions** (file-based routing under `functions/api/**`). Each file is a Worker handler exporting `onRequestGet/Post/Put/Delete`. |
| **Database** | Cloudflare **D1** (SQLite), bound as `env.DB`. |
| **AI** | Anthropic Messages API, called **server-side only** from `functions/api/chat.js` (key never reaches the browser). Model constant: `claude-sonnet-4-6`, `max_tokens: 2000`. |
| **Email** | Zoho **ZeptoMail** HTTP API (`functions/api/_email.js`). Guarded — no-ops until secrets set. |
| **CRM** | Zoho **CRM** Leads via REST/OAuth2 (`functions/api/_zoho.js`). Guarded — no-ops until secrets set. |
| **Hosting** | Cloudflare Pages. Push to `main` auto-deploys. Build `npm run build` → `dist/`. |
| **Domain** | humanity-ai.quest |

### Environment variables / secrets (Cloudflare)
| Var | Used by | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | `chat.js` | Required for the agent to reply. |
| `DB` (binding) | everything | D1 database binding. |
| `ZEPTOMAIL_TOKEN`, `EMAIL_FROM`, `EMAIL_FROM_NAME`, `ZEPTOMAIL_API_URL` | `_email.js` | Transactional email. Sends are skipped if unset. |
| `ZOHO_*` (`ZOHO_API_HOST`, refresh token, client id/secret) | `_zoho.js` | CRM lead creation. No-ops if unset. |

---

## 2. Data model (Cloudflare D1 / SQLite)

**Schema style: self-migrating.** There is **no `.sql` migration file**. Tables are created
on first use via `CREATE TABLE IF NOT EXISTS`, and new columns are added via idempotent
`ALTER TABLE … ADD COLUMN` wrapped in try/catch. The canonical DDL for the "movement" and
"conversation" tables lives in `functions/api/_movement.js` and `functions/api/_conversations.js`.

Two tables — **`users`** and **`sessions`** — are **not** created anywhere in code; they were
bootstrapped externally (wrangler / D1 console). Their columns below are reconstructed from the
queries that read and write them.

### 2.1 Entity groups

```
Identity & Access      users · sessions
Agent / Chat           conversations · messages · conversation_notes · interactions · guardrail_rules*
Ideas ("patent ledger") ideas · idea_status_log
Petition               signatures
Quests                 quests · quest_questions · quest_pitches
Surveys (pol.is-style)  surveys · survey_statements · survey_votes
Events                 events · event_rsvps
CRM / Members          member_notes · member_contacts · member_followups · member_tags · member_membership
CMS                    site_content · site_content_history
Email                  email_templates
Audit                  admin_actions
```
`*` = referenced by code but never created in code (externally provisioned; optional).

### 2.2 Identity & Access

#### `users`  *(externally bootstrapped)*
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | 32-hex UUID (`newId()`) |
| `email` | TEXT | lowercased, unique in practice |
| `password_hash` | TEXT | `saltHex:sha256(saltHex+password)` (Web Crypto; **SHA-256 + salt, not bcrypt/argon**) |
| `display_name` | TEXT | ≤50 chars |
| `role` | TEXT | `'user'` \| `'admin'` |
| `acl_level` | INTEGER | 0–5 (see [§3](#3-authentication--acl)) |
| `status` | TEXT | `'active'` \| `'banned'` |
| `phone` | TEXT | added at signup (self-migrated) |
| `country` | TEXT | added at signup |
| `newsletter` | INTEGER | 0/1, added at signup |
| `created_at` | DATETIME | (assumed; present in the bootstrap) |

#### `sessions`  *(externally bootstrapped)*
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | |
| `user_id` | TEXT → users.id | |
| `token` | TEXT | 64-hex random; sent as `hrc_session` cookie or `Authorization: Bearer` |
| `expires_at` | DATETIME | 30-day sessions; login keeps max ~5 per user |
| `created_at` | DATETIME | used to prune old sessions |

### 2.3 Agent / Chat  — `functions/api/_conversations.js`

#### `conversations` — one row per chat thread
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | client may supply to continue a thread |
| `user_id` | TEXT | nullable (anonymous chats) |
| `user_type` | TEXT | default `'anon'` |
| `kind` | TEXT | default `'agent'` |
| `mode` | TEXT | agent mode (e.g. Dialogue, Co-Ideator) |
| `flagged` | INTEGER | 0/1 |
| `flag_category` | TEXT | e.g. `'blocked'` when guardrails trip |
| `started_at` | DATETIME | |

#### `messages` — one row per turn
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | |
| `conversation_id` | TEXT → conversations.id | indexed (`idx_messages_conv`) |
| `role` | TEXT | `'user'` \| `'assistant'` |
| `content` | TEXT | |
| `flagged` | INTEGER | 0/1 |
| `flag_reason` | TEXT | guardrail reason |
| `created_at` | DATETIME | |

#### `conversation_notes` — admin annotations on a chat
`id` PK · `conversation_id` · `admin_id` · `note` · `note_type` (default `'comment'`) · `created_at`

#### `interactions` — unified append-only activity index
A best-effort pointer log so a chat, a vote, and a signature can be browsed together in one
admin view. **Not** source of truth (writes never throw).
`id` PK · `kind` · `user_id` · `participant` · `ref_type` · `ref_id` · `summary` (≤280) · `created_at`.
Indexed by `participant`, `(ref_type, ref_id)`, `kind`, `created_at`.

#### `guardrail_rules`  *(referenced, not created in code)*
Read by `chat.js`: `SELECT pattern, rule_type, action FROM guardrail_rules WHERE is_active = 1`.
Inferred columns: `pattern`, `rule_type`, `action`, `is_active`. If the table is absent, `chat.js`
falls back to hardcoded guardrails.

### 2.4 Ideas / "Humanity's Patent Ledger"  — `functions/api/ideas.js`, `auth/me.js`

#### `ideas`
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | |
| `user_id` | TEXT → users.id | registered users only |
| `title` | TEXT | |
| `content` | TEXT | |
| `status` | TEXT | default `'submitted'` |
| `clause_refs` | TEXT | JSON array of HRC clause refs |
| `conversation_id` | TEXT | links an idea back to the chat that produced it |
| `ledger_hash` | TEXT | SHA-256 chain hash (immutable ledger) |
| `prev_hash` | TEXT | previous entry's hash (chain link) |
| `tags` | TEXT | JSON array |
| `created_at` | DATETIME | |

#### `idea_status_log` — status-change history
`id` PK · `idea_id` · `old_status` · `new_status` · `admin_id` · `comment` · `visible_to_user` (0/1, default 1) · `created_at`

### 2.5 Petition  — `functions/api/_movement.js`, `sign.js`, `count.js`

#### `signatures`
`id` PK · `name` NOT NULL · `email` NOT NULL · `side` (default `'human'`; `human|developer`) · `country` · `created_at`

### 2.6 Quests (Shark-Tank-style innovation bounties)  — `functions/api/_movement.js`, `quests/**`

#### `quests`
`id` PK · `title` · `bounty` (e.g. `"$25,000"`) · `status` (default `'Open'`) · `summary` · `problem` · `tags` (JSON) · `created_at`

#### `quest_questions`
`id` PK · `quest_id` → quests.id · `author` · `question` · `answer` · `created_at`

#### `quest_pitches`
`id` PK · `quest_id` → quests.id · `name` · `email` · `approach` · `created_at`

### 2.7 Surveys (pol.is-style deliberation)  — `functions/api/_movement.js`, `surveys/**`

#### `surveys`
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | e.g. `'union-for-creators'`, `'petition-stance'` |
| `title` / `intro` | TEXT | |
| `status` | TEXT | `'open'` \| `'live'` |
| `location` | TEXT | where it renders, default `'surveys_page'` (`'petition'` for the stance wizard) |
| `slug` / `description` / `settings` | TEXT | added by migration; `settings` is JSON |
| `sort_order` | INTEGER | |
| `created_at` | DATETIME | |

#### `survey_statements`
`id` PK · `survey_id` → surveys.id · `text` · `author` (NULL = seeded) · `type` (default `'vote'`; also `'crowdfunding'`, `'signature'`) · `sort_order` · `created_at`

#### `survey_votes`
`id` PK · `survey_id` · `statement_id` · `value` (agree/disagree/pass) · `voter` · `created_at` · **`UNIQUE(statement_id, voter)`** (one vote per voter per statement). Votes are anonymous — deliberately not attributed to member profiles.

### 2.8 Events  — `functions/api/_movement.js`, `events/**`

#### `events`
`id` PK · `title` · `when_text` · `type` (Pitch/Networking/Roundtable) · `blurb` · `created_at`

#### `event_rsvps`
`id` PK · `event_id` → events.id · `name` · `email` · `created_at`

### 2.9 CRM / Members  — `functions/api/admin/members.js`

A **"member" is keyed by lowercased email** — the join key across `signatures`, `quest_pitches`,
`event_rsvps`, and `users`. These tables hang CRM data off that email.

| Table | Columns |
|---|---|
| `member_notes` | `id` PK · `member_email` · `author_id` · `note` · `created_at` |
| `member_contacts` | `id` PK · `member_email` · `author_id` · `channel` · `direction` (default `'inbound'`) · `summary` · `created_at` |
| `member_followups` | `id` PK · `member_email` · `author_id` · `title` · `due_date` · `status` (default `'open'`) · `created_at` |
| `member_tags` | `id` PK · `member_email` · `tag` · **`UNIQUE(member_email, tag)`** |
| `member_membership` | `member_email` PK · `monthly_pledge` · `is_founding` (0/1) · `status` · `updated_at` |

### 2.10 CMS  — `functions/api/admin/content.js`, `content.js`

#### `site_content` — editable page sections
`id` PK · `page_key` · `section_key` · `content_type` (default `'text'`) · `content` · `updated_by` · `updated_at` · **`UNIQUE(page_key, section_key)`**

#### `site_content_history` — revision log
`id` PK · `content_id` · `old_content` · `new_content` · `updated_by` · `created_at`

### 2.11 Email templates  — `functions/api/_email.js`

#### `email_templates`
`key` PK (e.g. `'welcome'`, `'signature_thanks'`) · `subject` · `html` (supports `{{var}}` interpolation) · `updated_at`. Seeded with defaults on first use; admin-editable.

### 2.12 Audit  — written by many admin endpoints

#### `admin_actions`
`id` PK · `admin_id` · `action_type` · `target_type` · `target_id` · `details` · `created_at`.
Defined redundantly in several modules so the moderation-history query never hits a missing table.

### 2.13 Relationship map

```
users 1──∞ sessions
users 1──∞ ideas 1──∞ idea_status_log
users 1──∞ conversations 1──∞ messages
                     conversations 1──∞ conversation_notes
surveys 1──∞ survey_statements 1──∞ survey_votes   (UNIQUE statement_id+voter)
quests  1──∞ quest_questions
quests  1──∞ quest_pitches
events  1──∞ event_rsvps

email  ──(soft join, lowercased)──►  member_notes / member_contacts /
        signatures · quest_pitches ·  member_followups / member_tags /
        event_rsvps · users               member_membership

interactions ──(pointer)──► any {ref_type, ref_id}   (append-only index, not FK-enforced)
admin_actions ──(pointer)──► {target_type, target_id} (audit log, not FK-enforced)
```
> **Note:** SQLite foreign keys are not declared; relationships are by convention. IDs are 32-hex
> `newId()` UUIDs except human-readable seed IDs (`'union-for-creators'`, `'e1'`, `'plastic-to-fuel'`).

---

## 3. Authentication & ACL

- **Password hashing:** salted SHA-256 via Web Crypto (`hashPassword`/`verifyPassword` in
  `functions/api/_shared.js`). Stored as `saltHex:hashHex`.
- **Sessions:** 64-hex random token in the `hrc_session` cookie (or `Authorization: Bearer`),
  looked up in `sessions` joined to `users`; expires in 30 days; banned users are rejected.
- **ACL levels** (`user.acl_level`, only meaningful when `role === 'admin'`):

| Level | Role name | Capability (typical) |
|---|---|---|
| 0 | user | normal account (submit ideas, chat, vote, RSVP) |
| 1 | viewer | read admin lists (members, content, conversations) |
| 2 | moderator | CRM mutations, moderation, segments/export |
| 3 | editor | edit CMS content, manage ideas/quests/surveys |
| 4 | manager | higher-privilege management |
| 5 | super admin | full control (users/roles) |

`requireACL(user, minLevel)` enforces **`role === 'admin' && acl_level >= minLevel`**. (A prior
bug used `||`, letting any admin bypass the level check — now fixed to `&&`.)

---

## 4. API surface (Cloudflare Pages Functions)

File-based routing: `functions/api/foo/bar.js` → `/api/foo/bar`. All responses are JSON with
permissive CORS. **Convention:** errors return HTTP 200 with `{ error }` so the frontend always
parses (`jsonError`).

### 4.1 Public / authenticated-user endpoints
| Route | Methods | Purpose |
|---|---|---|
| `/api/chat` | POST | HRC Agent chat → Anthropic. Guardrails, logs conversation+messages. |
| `/api/auth/signup` | POST | Register; creates user + session; welcome email + CRM lead (best-effort). |
| `/api/auth/login` | POST | Verify password, mint session, prune old sessions. |
| `/api/auth/logout` | POST | Invalidate session. |
| `/api/auth/me` | GET | Current user + their ideas. |
| `/api/ideas` | GET, POST | List my ideas / submit an idea (ledger-hashed). |
| `/api/sign` | POST | Sign the petition (writes `signatures`). |
| `/api/count` | GET | Signature count (public counter). |
| `/api/content` | GET | Public read of published CMS content. |
| `/api/quests` | GET, POST | List quests / (create). |
| `/api/quests/[id]` | GET | Quest detail. |
| `/api/quests/[id]/pitch` | POST | Submit a pitch. |
| `/api/quests/[id]/questions` | POST | Ask a question on a quest. |
| `/api/surveys` | GET | List surveys. |
| `/api/surveys/[id]` | GET | Survey + statements. |
| `/api/surveys/[id]/statements` | POST | Add a participant statement. |
| `/api/surveys/[id]/vote` | POST | Vote agree/disagree/pass (unique per voter). |
| `/api/surveys/[id]/results` | GET | Aggregated results. |
| `/api/events` | GET, POST | List events / (create). |
| `/api/events/[id]/rsvp` | POST | RSVP to an event. |

### 4.2 Admin endpoints (ACL-gated, under `/api/admin/`)
| Route | Methods | Min ACL | Purpose |
|---|---|---|---|
| `/api/admin` | GET | 1 | Dashboard stats (counts across tables). |
| `/api/admin/users` | GET, POST, PUT | mixed (up to 5) | Manage accounts, roles, bans. |
| `/api/admin/members` | GET, POST | 1 view / 2 mutate | Unified CRM profile + timeline. |
| `/api/admin/segments` | GET | 2 | Build/export mailing segments (CSV) from filters. |
| `/api/admin/conversations` | GET, POST, PUT | — | Browse/flag/annotate agent chats. |
| `/api/admin/comments` | GET, DELETE | — | Moderate individual messages. |
| `/api/admin/notes` | GET | — | Conversation notes. |
| `/api/admin/ideas` | GET, POST, PUT | — | Triage ideas, change status (logs to `idea_status_log`). |
| `/api/admin/quests` | GET, POST | — | Manage quests. |
| `/api/admin/surveys` | GET, POST | — | Manage surveys/statements. |
| `/api/admin/events` | GET, POST | — | Manage events. |
| `/api/admin/signatures` | GET, POST | — | View/manage petition signatures. |
| `/api/admin/content` | GET, POST, PUT | 1 view / 3 edit | CMS upsert w/ revision history. |
| `/api/admin/audit` | GET | — | Read `admin_actions` audit log. |

### 4.3 Shared modules (not routes)
| File | Role |
|---|---|
| `functions/api/_shared.js` | CORS, JSON helpers, password hashing, `getUser`, `requireACL`, `newId`. |
| `functions/api/auth/_shared.js` | Duplicate of the above (auth subtree copy). |
| `functions/api/_conversations.js` | Conversation/message/interactions schema + `logInteraction`. |
| `functions/api/_movement.js` | Petition/quests/surveys/events schema + seed data. |
| `functions/api/_email.js` | ZeptoMail send + `email_templates` schema. |
| `functions/api/_zoho.js` | Zoho CRM lead creation. |

---

## 5. The HRC Agent (chat) pipeline

`POST /api/chat` (`functions/api/chat.js`):
1. Ensure conversation schema exists.
2. **Input guardrails** — load active rules from `guardrail_rules` (fallback to hardcoded) and
   check for profanity / prompt-injection / off-topic. Blocked messages are still logged with
   `flagged=1`, `flag_category='blocked'`, and a polite refusal referencing HRC dignity clauses.
3. Build the system prompt (`buildSystemPrompt()`) embedding all 52 HRC clauses; the agent speaks
   in-character as the constitution.
4. Reuse the client-supplied `conversation_id` for multi-turn threads (validated against DB).
5. Call Anthropic (`claude-sonnet-4-6`, `max_tokens: 2000`) with `ANTHROPIC_API_KEY`.
6. Persist both turns to `messages`; append to `interactions`.

**HRC content** lives as three arrays at the top of `src/App.jsx`: `HRC_CORE` (33 Core Rights,
Section I), `HRC_GOV` (10 Governance, Section II), `HRC_OPS` (9 Operational Mandates, Section III)
= 52 clauses, each `{ n, t (title), s (summary), r (reasoning) }`.

---

## 6. Frontend structure

- **`src/App.jsx`** — the entire public site: 10 pages (`home`, `constitution`, `quest`, `agent`,
  `os`, `community`, `ledger`, `manifesto`, `join`, `about`), the interactive 52-clause HRC
  explorer, and the `HRCAgent` chat component. State is in-memory React (no localStorage).
- **`src/AdminDashboard.jsx`** — the admin console consuming the `/api/admin/*` endpoints
  (members/CRM, conversations, ideas, content/CMS, surveys, quests, events, audit).
- **`src/useTTS.jsx`** — text-to-speech helper for the agent.
- **`src/functions-api-ideas-RECORDING.js`** — a recording/reference artifact (not a route).

---

## 7. External integrations

| Integration | File | Trigger | Fails safe? |
|---|---|---|---|
| **Anthropic Messages API** | `chat.js` | every agent reply | Returns error JSON if key missing. |
| **Zoho ZeptoMail** (email) | `_email.js` | signup welcome, signature thanks | Yes — skipped silently if unset. |
| **Zoho CRM** (leads) | `_zoho.js` | signup / signature | Yes — no-op if unset. |

Everything runs on the free Cloudflare tier: Pages (static + Functions) + D1.

---

## 8. Caveats & source of truth

- **No migration file.** The DDL here is reconstructed from `CREATE TABLE IF NOT EXISTS` /
  `ALTER TABLE` calls scattered across the Functions. The authoritative DDL modules are
  `_movement.js` and `_conversations.js`; per-feature tables self-migrate on first request.
- **`users` and `sessions` are not created in code** — provisioned externally. Their columns are
  inferred from queries; `users.created_at` in particular is assumed.
- **`guardrail_rules` is read but never created** in code — treat as optional/external; `chat.js`
  degrades to hardcoded guardrails without it.
- **No enforced foreign keys.** All relationships are by convention; `interactions` and
  `admin_actions` are polymorphic pointer/audit logs, not FK-constrained.
- **Members are email-keyed**, joining otherwise-separate anonymous sources; survey votes are
  intentionally excluded from member attribution.
- **Error responses use HTTP 200** with an `{ error }` body by design.
- **Mock/seed data** exists (3 quests, 2 surveys, 3 events, default email templates) — replace
  with real data as the movement grows.
```

Regenerate this map after schema changes: grep the Functions for
`CREATE TABLE`, `ALTER TABLE`, and `env.DB.prepare(` to catch new tables/columns.
```
