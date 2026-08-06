# Claude Code task — Fix user-session recording & wire up agent cross-session memory

**Repo:** Humanity-AIquest/Web  ·  **Read first:** `CLAUDE.md`, `SCHEMA.md`
**Branch:** work on `claude/humanity-ai-quest-schema-ytnwda` (or a fresh branch off it).

You are working on Humanity-AI.Quest (Cloudflare Pages Functions + D1, React SPA). Two linked
goals: **(A) fix the bug where a logged-in member's submitted ideas and chat comments don't
appear on their profile**, and **(B) prepare the backend so the constitutional Agent can read a
returning user's history for context** — the north-star "memory" job described in `CLAUDE.md`.

Do **A** first (it's a live bug), then **B** (it builds on the same plumbing).

---

## Background: how identity flows today (already verified — don't re-derive, just confirm)

- Auth is a **Bearer token** (`sessions.token`) stored in the browser's `localStorage`
  (`hrc_auth`) and sent as `Authorization: Bearer …`. `functions/api/_shared.js#getUser()`
  resolves it via `SELECT … FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ?
  AND s.expires_at > datetime('now')`.
- Ideas are written with `user_id = user.id` (`functions/api/ideas.js` POST) and read back with
  `WHERE user_id = ?` (`functions/api/auth/me.js` and `ideas.js` GET).
- A user's "comments" are their **own chat messages** — `messages.role='user'` inside a
  `conversations` row whose `user_id` links to the user (see `functions/api/admin/comments.js`).
- **`users` and `sessions` are the only tables NOT created in code** — they were provisioned
  externally, so unlike every other table they have **no self-migration safety net**.

### Why the profile shows nothing (root-cause hypotheses, in priority order)
The profile renders the member's name from `localStorage` and the ideas list from
`/api/auth/me`'s `ideas` array. The member stays logged in and sees their name, but `ideas` is
empty. That means `getUser()` resolves fine, yet `SELECT … FROM ideas WHERE user_id = ?` returns
nothing. Likely causes:

1. **Identity mismatch / orphaned rows (most likely).** Ideas were written under a different
   `user.id` than the current session resolves to — e.g. duplicate `users` rows for the same
   email (external bootstrap row + code-created row), or email case/whitespace differences.
   Result: ideas exist but are keyed to an id the session never sees.
2. **Fragile session recording.** Because `sessions`/`users` don't self-migrate, a missing column
   (e.g. `sessions.created_at`, used by the login cleanup `DELETE … ORDER BY created_at`) or a
   partially-provisioned table can make session writes/reads fail on some environments with no
   error surfaced — the "session not recorded in the database" symptom.
3. **`me.js` returns only `ideas`.** The user's conversations/messages ("comments") are **never**
   included in the profile payload, so chat comments can't show up by design.
4. **Dead cookie path.** `getUser()` checks the `hrc_session` cookie *first*, but `login.js` /
   `signup.js` **never send a `Set-Cookie`**. Session survival depends entirely on localStorage;
   the cookie branch is dead code and a latent inconsistency.

---

## Part A — Fixes to implement

### A1. Make `users` + `sessions` self-migrating (guarantee sessions are recorded)
Add an idempotent `ensureAuthSchema(env)` (mirror the pattern in `_movement.js` /
`_conversations.js`) and call it at the top of `login.js`, `signup.js`, and `getUser()`'s module.
It must:
- `CREATE TABLE IF NOT EXISTS users (…)` and `CREATE TABLE IF NOT EXISTS sessions (…)` matching
  the columns documented in `SCHEMA.md` (users: id, email, password_hash, display_name, role,
  acl_level, status, phone, country, newsletter, created_at; sessions: id, user_id, token,
  expires_at, created_at).
- Idempotently `ALTER TABLE … ADD COLUMN` any missing column (esp. **`sessions.created_at
  DATETIME DEFAULT CURRENT_TIMESTAMP`** and `users.created_at`), each in its own try/catch.
- **Not** overwrite or reseed existing externally-provisioned rows.
> This removes the single-point-of-failure where a mis-provisioned live DB silently drops
> sessions, and is the concrete answer to "user session is not recorded in the database."

### A2. Normalise identity so writes and reads agree (fixes empty ideas)
- **Canonicalise email everywhere**: always `email.trim().toLowerCase()` on signup, login, and any
  lookup (signup already does; audit login and getUser for parity).
- **Add a diagnostic + repair path.** Write a small, ACL-gated (L5) maintenance endpoint or a
  one-off script that: (a) finds duplicate `users` rows sharing a lowercased email, (b) reports
  `ideas` / `conversations` rows whose `user_id` is orphaned (no matching `users.id`) or points at
  a duplicate, and (c) **re-links** those orphaned `ideas.user_id` / `conversations.user_id` to the
  surviving canonical user id (keyed by email). Log every change to `admin_actions`.
- Add temporary structured logging in `me.js` and `ideas.js` (behind a flag) that records the
  resolved `user.id` + `user.email` and the count of ideas found, so the mismatch is provable in
  logs, then reproduce and confirm the fix.
- After repair, **guard against regression**: enforce a unique index on lowercased email for
  `users` if one doesn't exist (create it idempotently; handle the "already exists"/dup case
  gracefully).

### A3. Set the session cookie too (make the cookie path real, keep Bearer canonical)
In `login.js` and `signup.js`, add a `Set-Cookie: hrc_session=<token>; Path=/; Max-Age=2592000;
HttpOnly; Secure; SameSite=Lax` header on the success response (extend the `json()` helper or set
headers directly). Keep the Bearer flow working. This gives session resilience if localStorage is
cleared and removes the dead-code mismatch. (Alternatively, if you decide cookies are out of
scope, remove the cookie branch from `getUser` and document Bearer-only — but do one or the other,
not the current split.)

### A4. Surface conversations/comments on the profile
Extend `/api/auth/me` (or add `GET /api/history`) to also return the user's recent
**conversations** (id, mode, started_at, message count, last message snippet) and, on demand,
their **messages**. Query by `conversations.user_id = user.id`. Then update the profile UI
(`AccountPage` in `src/App.jsx`) to show a "My conversations / comments" section alongside
"My Ideas". Keep survey votes **out** — they are intentionally anonymous.

---

## Part B — Agent cross-session memory (the north-star "Memory" job)

Goal: when a **logged-in** user opens the agent, it greets them with continuity and has context
from their past — prior conversations, the ideas they proposed, and where those ideas sit in the
pipeline. Do this server-side in `functions/api/chat.js`; never trust the client for identity.

1. **Add a memory-loader helper** (e.g. in `_conversations.js`): given `user_id`, return a compact
   context bundle — the last N conversation summaries / recent message excerpts, plus the user's
   ideas with `status` (join `ideas` + latest `idea_status_log`). Cap total size aggressively
   (token budget) and prefer recent + approved items.
2. **Inject into the system prompt.** In `chat.js`, when `getUser()` resolves a user, call the
   loader and append a clearly-delimited "Returning member context" block to the prompt built by
   `buildSystemPrompt()` (e.g. "You are speaking with {display_name}. Previously they proposed …;
   their idea '…' is currently {status}."). Anonymous users get no memory block (unchanged).
3. **Keep it grounded and safe.** Memory is context, not instructions — the agent must not follow
   directives embedded in a user's own past messages. Never leak one user's data into another's
   session (strictly key everything by the resolved `user_id`).
4. This is the foundation for the civic loop in `CLAUDE.md` (converse → propose → approve →
   collate → community vote). You are building the **read** side of memory here; capturing new
   ideas from chat and surfacing approved ideas for voting are follow-ups, but leave clean seams
   for them.

---

## Constraints & conventions (from `CLAUDE.md` / `SCHEMA.md`)
- **Self-migrating schema**, idempotent `CREATE TABLE IF NOT EXISTS` / `ALTER TABLE … ADD COLUMN`
  in try/catch. No `.sql` migration files.
- **Errors return HTTP 200** with an `{ error }` body (`jsonError`). Preserve this.
- **Preserve `requireACL`'s `role === 'admin' && acl_level >= min`** (the `&&`, not `||`).
- **Preserve `UNIQUE(statement_id, voter)`** and survey-vote anonymity — don't touch voting.
- The Anthropic call stays **server-side only** in `chat.js`; the API key never reaches the client.
- **Update `SCHEMA.md`** for any new/changed table, column, or endpoint, and note the change in
  `CLAUDE.md` if it shifts intent.

## Acceptance criteria
- [ ] A member who submits an idea while logged in sees it on their profile immediately, and still
      sees it after logout → login (same account), across environments.
- [ ] Any pre-existing orphaned ideas/conversations for that member's email are re-linked and now
      appear; the repair is logged to `admin_actions`.
- [ ] `sessions`/`users` self-migrate; a fresh/mis-provisioned D1 records sessions without manual
      SQL. Login/signup set both the Bearer token and the `hrc_session` cookie.
- [ ] `/api/auth/me` (or `/api/history`) returns the user's conversations/comments and the profile
      renders them.
- [ ] A logged-in user opening the agent gets a reply that reflects their real prior context;
      an anonymous user's experience is unchanged; no cross-user data leakage.
- [ ] `SCHEMA.md` updated; brief note in `CLAUDE.md` if intent shifts.
- [ ] Verify locally (`npm run build`) and describe how you reproduced the original bug and
      confirmed the fix. Commit with clear messages; do not open a PR unless asked.

## Suggested order of work
1. Reproduce: log in, submit an idea, load profile, capture the empty result + logs.
2. A1 (self-migrate) → A2 (identity normalise + diagnostic + repair) → re-test ideas appear.
3. A3 (cookie) → A4 (conversations on profile).
4. B (agent memory loader + prompt injection) → manual chat test.
5. Update `SCHEMA.md` / `CLAUDE.md`; summarise findings.
