# HRC Agent — Architecture Gap Analysis & Sprint Roadmap

> **Status:** Analysis only — no implementation follows from this document.
> **Companions:** [`SCHEMA.md`](../../SCHEMA.md) (data model + API ground truth) ·
> [`CLAUDE.md`](../../CLAUDE.md) (orientation + intent) ·
> [`docs/tasks/fix-session-recording-and-agent-memory.md`](../tasks/fix-session-recording-and-agent-memory.md) (Sprint 0, specified and ready)

## Purpose

Humanity-AI exists to build the HRC Agent: the constitutional agent that wins popular support for
the Humanities-AI Rights Constitution and facilitates its development *forever*. This document
answers one question: **what is in place, and what is missing before the agent can run the entire
process?**

Assessed against the live backend — 24 D1 tables and ~35 endpoints, mapped in `SCHEMA.md`.

## Executive summary

**We have built an excellent system of record, and almost none of the system of action.** The agent
is a very good talker wired to a database it cannot touch. Every state change in the civic loop
today requires a human to leave the conversation and fill in a form, or an admin to click something
in the console.

Three structural facts drive the roadmap:

1. **The agent cannot act.** `functions/api/chat.js` has **no tool use / function calling** — it
   builds a system prompt, calls Anthropic, and stores the reply. It cannot create an idea, open a
   vote, send a follow-up, or update a record. There is also no approval surface and no admin agent.
2. **The HRC is not in the database.** All 52 clauses are hardcoded *twice* — as three arrays in
   `src/App.jsx` and as a template literal `HRC_CLAUSES` in `functions/api/chat.js`. There is no
   `clauses` table. Therefore no versioning, no maturity levels, no per-clause consensus, and two
   copies that can silently drift apart.
3. **There is no notification substrate.** No notifications table exists anywhere. Yet
   `functions/api/admin/ideas.js` returns *"User will be notified"* when an admin changes an idea's
   status — **nothing is sent**. Email sends are not logged either. This is a live false promise
   worth fixing on its own merits.

---

## Part 1 — Database & architecture gaps

### 1.1 What the schema does well

Foundations worth preserving: the hash-chained `ideas` ledger (`ledger_hash`/`prev_hash`),
`UNIQUE(statement_id, voter)` protecting one-person-one-vote, `idea_status_log` as real lifecycle
state, the polymorphic `interactions` index, the `admin_actions` audit trail, and the self-migrating
schema pattern that lets features ship without migration files.

### 1.2 The eight gaps

| # | Gap | Evidence | Blocks |
|---|---|---|---|
| **G1** | **Agent has no write path** — no tool use, no approval queue, no admin agent | `chat.js` — no `tools`/`tool_choice` | Everything. The agent cannot run any process. |
| **G2** | **HRC clauses not in DB; no versioning or maturity** | Hardcoded in `src/App.jsx` + `chat.js` | Clause versioning, maturity levels, per-clause consensus, HRC editions |
| **G3** | **No notifications; email sends unlogged** | No table; `admin/ideas.js` claims notification | Follow-up loop, "notifications" in user account, re-engagement |
| **G4** | **No deliberation structures** | Only flat `survey_statements`; no threading, no stance, no issue tracking | Expert consensus, debate transcripts→summaries, tracked open issues |
| **G5** | **No memory retrieval** | `conversations`/`messages` are written but **never read back** into a prompt | Cross-session recall, "pick up where we left off" |
| **G6** | **No teams / projects / messaging** | Nothing in schema | Expert teams collaborating, seeing each other's work |
| **G7** | **Fragmented identity + no funnel state** | `quest_pitches`, `event_rsvps`, `signatures` have **no `user_id`** (email-only); CRM is email-keyed while ideas are `user_id`-keyed; `member_membership.monthly_pledge` is free-text `TEXT`; no transactions table | Unified user context, CRM funnel, contribution tracking |
| **G8** | **No collation entity; voting is admin-only** | Surveys creatable only at ACL L3+; nothing links approved ideas → a vote | The `approve → collate → community vote` half of the civic loop |

**Prerequisite:** the session/identity bug documented in
`docs/tasks/fix-session-recording-and-agent-memory.md` — `users`/`sessions` don't self-migrate and
ideas can orphan to a different `user_id`. Until identity is trustworthy, per-user memory and the
funnel cannot be built on it.

**Secondary gaps:** survey results are raw counts only (`surveys/[id]/results.js` notes clustering
is "a later phase") — no opinion clustering, so we cannot distinguish *consensus* from *division*;
and conversation `mode` (4 prefixes: `ideate`, `debate_for`, `debate_against`, `explain`) shapes
tone but carries no process semantics.

---

## Part 2 — Use cases the agent supports **today**

Only the first six are things the *agent* does. The rest are platform capabilities the agent can
describe but not operate.

**Agent-native (conversational)**

1. Constitutional Q&A — all 52 clauses in-prompt, cites clause IDs, PhD-level analysis
2. Clause explanation for newcomers (`explain` mode)
3. Co-ideation within a single session (`ideate` mode)
4. Structured argument — advocate (`debate_for`) / critical examiner (`debate_against`)
5. Amendment analysis — how a proposed clause interacts with existing ones
6. Guardrailed refusal with dignity-grounded framing; blocked messages still logged and flagged

**Platform (human/admin-operated)**

7. Idea capture to the immutable ledger — *user fills a form*; agent pre-fills via "save as idea"
8. Idea lifecycle tracking (7 statuses) with user-visible admin comments
9. Anonymous community voting on preset statements; user-submitted statements
10. Petition signing + stance wizard; live signature count
11. Quest browsing, Q&A, pitch registration (email-only, not linked to account)
12. Event listing + RSVP
13. Admin CRM — member profile, cross-source timeline, notes, contacts, follow-ups, tags, CSV segments
14. Admin review — conversation browsing/flagging/notes, comment moderation, idea triage, audit log
15. CMS editing with revision history
16. Transactional email (welcome, signature thanks) — fired by signup/sign only

---

## Part 3 — Use cases the agent *could* support, and what each needs

| Vision use case | Status | Required changes |
|---|---|---|
| **Remember user context across sessions** | ✗ | Fix identity bug; add `conversation_summaries` + `user_memory`; memory loader injecting recent conversations + idea statuses into the prompt (G5) |
| **Facilitate expert consensus on clauses** | ✗ | Deliberation engine: `deliberations`, `arguments` (threaded, stance for/against), `argument_votes`, `deliberation_summaries` (agent-generated), `open_issues`; agent tools to summarise transcripts and track unresolved issues (G4, G1) |
| **Clause versioning + maturity levels** | ✗ | `clauses`, `clause_versions` (maturity: draft→proposed→debated→consensus→ratified→superseded), `hrc_editions`, `edition_clauses`, `clause_dependencies`; `chat.js` + `App.jsx` read from DB, retiring both hardcoded copies (G2) |
| **Follow-up via email, recorded under 'notifications'** | ✗ | `notifications`, `notification_prefs`, `email_log`; wire the existing ZeptoMail `sendTemplate` to real events; make `admin/ideas.js`'s promise true (G3) |
| **Configurable agent authority (approve-all → automate)** | ✗ | `agent_policies` (per-tool authority: `require_approval` \| `auto` \| `disabled`); `agent_actions` as combined audit log + approval queue (G1) |
| **Admin dashboard: agent visibility, approvals, admin chat** | ✗ | Admin console pages + `/api/admin/agent*`; admin-only agent chat with an ACL-gated tool registry, `conversations.kind='admin_agent'` (G1) |
| **CRM funnel: signup → involved → contributing** | Partial | Backfill `user_id` on `signatures`/`quest_pitches`/`event_rsvps`; add `member_stage` + `contributions` (funds/idea/vote/argument/time); replace free-text `monthly_pledge` with real amounts (G7) |
| **Ideation engine for inventors** | Partial | Agent tools to create/refine ideas in-conversation; idea iterations/versioning; link idea → clause proposal; critique loop reusing `debate_against` (G1) |
| **Bounty competitions (e.g. Ocean Cleanup)** | Partial | `quests` exists; add `user_id` to pitches, submission iterations, rubric/scoring, judging; agent-guided solution development (G1, G7) |
| **Expert teams: shared work, comments, messaging** | ✗ | `teams`, `team_members`, `team_messages`, shared `workspace_items` (G6) |
| **Agent presents approved ideas for community vote** | ✗ | Collation entity linking approved ideas → survey; agent tool to open a vote (policy-gated); opinion clustering on results (G8) |
| **Agent-run onboarding / joining** | ✗ | Agent tools for signing, RSVP, account actions under the authority model (G1) |

---

## Part 4 — Sprint roadmap

Each sprint is independently shippable and ordered by dependency.

### Sprint 0 — Trustworthy identity *(prerequisite)*
Execute `docs/tasks/fix-session-recording-and-agent-memory.md`: self-migrate `users`/`sessions`,
normalise email identity, repair orphaned rows, surface conversations on the profile.
*Nothing per-user is safe to build until this lands.*

### Sprint 1 — The constitution becomes data (G2)
`clauses` / `clause_versions` (with maturity) / `hrc_editions` / `edition_clauses` /
`clause_dependencies`. Seed from the existing 52. Repoint `chat.js` (build clause text from DB,
cached) and `src/App.jsx`; delete both hardcoded copies.
*Unlocks versioning, per-clause deliberation, and eliminates the drift risk.*

### Sprint 2 — Agent memory, read side (G5)
`conversation_summaries` + `user_memory`; memory loader injects a delimited "returning member"
block — treated as context, never as instructions; strictly keyed by resolved `user_id`.

### Sprint 3 — Agent hands + configurable authority + Admin Agent Console (G1)
The pivotal sprint. Three parts shipped together, because approve-everything is the launch mode:

- **Tool use** in `chat.js` — start with `submit_idea`, `search_clauses`, `get_my_status`,
  `sign_petition`, `rsvp_event`.
- **Configurable authority** — `agent_policies` sets per-tool authority (`require_approval` |
  `auto` | `disabled`), resolved at call time. Launch with *everything* on `require_approval`;
  flip individual tools to `auto` as each process proves itself. `agent_actions` serves as both
  audit log and approval queue (`proposed → pending_approval → approved/rejected → executed`).
- **Admin Agent Console** — dashboard for agent visibility (actions, pending count, flagged
  conversations), an approvals queue (approve/reject with comment), and an **admin-only agent
  chat** (`conversations.kind='admin_agent'`) with a separate, ACL-gated tool registry for
  administrative tasks.

> **Security requirement:** admin tools must be gated at *execution* time via `requireACL`, never
> by prompt instruction alone, and must be unreachable from the public chat endpoint.

### Sprint 4 — Notifications & the follow-up loop (G3)
`notifications`, `notification_prefs`, `email_log`; in-app notification centre on the profile;
wire ZeptoMail to idea status changes, deliberation invites, and unresolved-issue nudges.

### Sprint 5 — Deliberation engine (G4)
`deliberations`, `arguments` (threaded + stance), `argument_votes`, `deliberation_summaries`,
`open_issues`, participants/roles. Agent tools: summarise transcript, extract open issues, tally
for/against, nudge non-responders. Attach a deliberation to a `clause_version`.
*This is the "humanity agrees on the HRC" machine.*

### Sprint 6 — Collation → community vote + clustering (G8)
Link approved ideas into a candidate clause version; agent-opened votes (policy-gated); opinion
clustering on `survey_votes` to surface consensus vs division.
*Closes the civic loop: converse → propose → approve → collate → vote → clause.*

### Sprint 7 — Member funnel & contributions (G7)
`member_stage`, `contributions`, real pledge amounts; backfill `user_id` across
signatures/pitches/RSVPs; unify the email-keyed CRM with account identity; expose funnel state as
agent context.

### Sprint 8 — Teams & bounty competitions (G6, quests)
`teams`, `team_members`, `team_messages`, `workspace_items`; quest submissions with iterations,
rubric scoring and judging; agent-guided solution development for challenges like Ocean Cleanup.

### Cross-cutting guardrails (every sprint)
Every agent write audited in `agent_actions`; authority always resolved from `agent_policies`,
never hardcoded; memory never crosses users; survey votes stay anonymous; `requireACL` keeps its
`&&`; `SCHEMA.md` updated with every schema change.

---

## Verifying the headline claims

| Claim | Check | Expected |
|---|---|---|
| G1 — agent cannot act | `grep -n "tools" functions/api/chat.js` | empty |
| G3 — no notifications | `grep -rn "notification" functions/` | empty |
| G2 — clauses hardcoded twice | `grep -n "HRC_CLAUSES" functions/api/chat.js` · `grep -n "HRC_CORE" src/App.jsx` | hits in **both** files — two independent sources of truth for the same 52 clauses |
