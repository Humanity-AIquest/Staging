# V3 · "Pi, the Constant" — handoff

Branch: `v3/pi-pivot` (forked from `development`; **`main` is untouched and still live**).
Safety net: tags `pre-v3-main-2026-10-01`, `pre-v3-development-2026-10-01`, and an offline bundle
`humanity-ai-web-pre-v3-2026-10-01.bundle` (in `MC Claud/backups`).

## What V3 is
Graphics and content imported into the existing code base. No framework, build or backend changes.

| Area | Change |
|---|---|
| Home (`/`) | Replaced by `HomeV3`: Pi hero, founding-campaign strip, Guard/Attest/Audit/Amend orbit, Prime Promise + 12 pledge cards, "how a rule is born", Ask-Pi chat, the long-view closing. |
| New page `?page=back` | **Back the Project**: campaign meter, what the money builds, three tiers, FAQ, GoGetFunding CTA. |
| Constitution page | Default tab = **The 12 Pledges** (full text + "Technically"). Second tab = the original 52 draft clauses, unchanged. |
| Nav / agent | "HRC Agent" renamed **Ask Pi**; greeting and backend system prompt now introduce Pi and the 12 pledges. The 52 clauses stay in the prompt as reference. |
| Legacy | `/?legacy=1` shows the previous home page for comparison or rollback. |

## Files
- NEW `src/v3/PiV3.jsx` — all V3 components + all V3 CSS (namespaced `.v3-*`).
- NEW `src/v3/pledges.js` — Prime Promise + 12 pledges (default text).
- NEW `public/pi/*.webp` — 11 locked, text-free brand images (about 380 KB total).
- EDIT `src/App.jsx` — import + one `createV3(...)` call, home/back routing, Constitution tabs, nav label changes (about 60 lines).
- EDIT `functions/api/chat.js` — system prompt prefix only.
- EDIT `index.html` — meta description only.

## Editing the words
Every visible string is an editable CMS field (`<E p="home|back|constitution" k="v3_...">`). Use Admin → CMS exactly as today.
New keys are `v3_*`, so editing them never touches the live site's existing copy.
Pledge names/one-liners on the home page: `home` → `v3_pl_I01_name` … `v3_pl_I12_line`.
Full pledge text (Constitution page) lives in `src/v3/pledges.js` (edit in code, or tell Claude).

## Funding numbers (blank until you set them)
In Admin → CMS, page `back`: `fund_goal`, `fund_raised`, `fund_backers`, `fund_currency`, `fund_url`.
Until `fund_goal` and `fund_raised` are numbers the meter shows a "goal will appear here" line. Nothing is invented.
`fund_url` defaults to the GoGetFunding campaign link already used on the site.

## Before pushing live — please check
1. Tier copy on **Back the Project** ($100 / month founding partner) matches what you will honour.
2. "1,000 year design life" and "Pi tests every idea against the pledges" are product claims; confirm you are happy to publish them.
3. The Ask-Pi chat on the home page is an illustrative example (labelled "Example").
4. Other pages (Manifesto, Your Agent, OS, Community, Ledger, About, Footer) still say "52 clauses" / "HRC Agent". Not changed in this sprint.
5. The CMS database is shared by every branch. Edits made while previewing V3 are saved to the same D1 database; only `v3_*` keys are affected.

## Run locally
```
git checkout v3/pi-pivot
npm install
npm run dev
```

## Roll back
`git checkout main` (nothing was changed there), or open `/?legacy=1` to compare.

## Quest OS page (`?page=quest`) — added
Source: `src/v3/QuestV3.jsx`. Built from the platform docs (Quest v3 Migration Plan; Utopi "Quests" mockups).
- Three campaign types: **Prize Quest** (pre-funded prize), **Startup Quest** (pre-crowdfunded startup funding; winners build the PoC, then the solution), **Crowd Campaign** (regular crowdfunding).
- Flagship quest: "Humanity's first OS moment", with a pre-funded meter driven by CMS fields `quest` → `fund_goal`, `fund_raised` (blank until set).
- Kickstarter-style board: search, type + status filters, cards with cover art, badge, prize, tags, progress/deadline when the API provides `goal`/`raised`/`deadline`. Live data from `GET /api/quests`; shows labelled sample quests if the API is empty.
- Lifecycle rail: Fund, Pitch, Panel, Award, Build the PoC, Ship the solution (money follows milestone tranches).
- Pitch + Q&A reuse the existing live `QuestDetail` (opens in a modal), so registration still works.
- "Launch a quest" / "Sponsor a quest" open a prefilled email to build@humanity-ai.quest (no new backend).
- Honesty rules from the docs are on the page: progress is aspirational until goals are met; no live payments.

### Not built (needs your decision)
- Real money movement (escrow, tranches, refunds). The migration plan lists payments as an Antony gate.
- API fields for type, goal, raised, deadline, teams. The page uses them when present.
- A team/entry view per quest and the panel scoring UI.

## Update 2026-10-01 (decisions from Antony)
- **Agent name:** Uto-Pi (hyphenated, trademark), Pi for short, Guardian of the Covenant. Applied to home, chat prompt, greeting, agent header, Constitution credit line, meta description. Never write Utopi.
- **Authorship credit:** the Covenant is credited to Uto-Pi alongside its human authors (CMS keys constitution/v3_credit_*).
- **Demo notice:** sticky bar on every public page: only the Founders Series pre-funding round is live, everything else is demo. CMS keys global/v3_demo_tag, v3_demo_text, v3_demo_cta.
- **CMS:** the live copy was archived to functions/api/_cms_archive.js (55 rows, snapshot 2026-10-01) and imported once, newer-wins, by functions/api/_cms.js. Constitution intro moved to key v3_intro so the old override does not mask it.
- **Quest data:** quests now have type, goal, raised, currency, deadline, backers, sponsor, pledges[], tranches[], is_demo; team count = registered pitches. Admin > Quests API supports update_quest / create_quest. Two demo quests added (first-os-moment has no invented goal). All figures are demo (is_demo=1).
- **Open item:** the GoGetFunding link https://gogetfunding.com/?p=9622734 returns 404 for the public (likely an unpublished draft). Set the public URL in CMS back/fund_url.
