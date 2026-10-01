/**
 * Shared schema + seed for the "movement" features added in the manifesto
 * redesign: petition signatures, innovation quests, pol.is-style surveys,
 * and events. All tables are created on demand (CREATE TABLE IF NOT EXISTS)
 * against the SAME D1 binding (env.DB) the rest of the backend uses, so the
 * existing agent/auth/admin tables are never touched.
 *
 * Pattern mirrors functions/api/ideas.js (self-migrating, idempotent).
 */
import { newId } from "./_shared.js";

let _seeded = false;
let _schemaReady = false;      // schema + migrations + seeds finished once in this isolate

export async function ensureMovementSchema(env) {
  if (_schemaReady) return;
  // ── Petition ───────────────────────────────────────────────────────────────
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS signatures (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    side TEXT NOT NULL DEFAULT 'human',
    country TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();

  // ── Quests ───────────────────────────────────────────────────────────────────
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS quests (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    bounty TEXT,
    status TEXT DEFAULT 'Open',
    summary TEXT,
    problem TEXT,
    tags TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();

  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS quest_questions (
    id TEXT PRIMARY KEY,
    quest_id TEXT NOT NULL,
    author TEXT,
    question TEXT NOT NULL,
    answer TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();

  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS quest_pitches (
    id TEXT PRIMARY KEY,
    quest_id TEXT NOT NULL,
    name TEXT,
    email TEXT,
    approach TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();

  // ── Surveys (pol.is-style) ──────────────────────────────────────────────────
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS surveys (
    id TEXT PRIMARY KEY,
    title TEXT,
    intro TEXT,
    status TEXT DEFAULT 'open',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();

  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS survey_statements (
    id TEXT PRIMARY KEY,
    survey_id TEXT NOT NULL,
    text TEXT NOT NULL,
    author TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();

  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS survey_votes (
    id TEXT PRIMARY KEY,
    survey_id TEXT NOT NULL,
    statement_id TEXT NOT NULL,
    value TEXT NOT NULL,
    voter TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(statement_id, voter)
  )`).run();

  // ── Events ───────────────────────────────────────────────────────────────────
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    title TEXT,
    when_text TEXT,
    type TEXT,
    blurb TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();

  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS event_rsvps (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    name TEXT,
    email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();

  // ── Admin audit log (written by admin endpoints; never created in code) ─────
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS admin_actions (
    id TEXT PRIMARY KEY, admin_id TEXT, action_type TEXT, target_type TEXT,
    target_id TEXT, details TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();

  // ── Migrations: columns added after the original bootstrap (idempotent) ──────
  for (const sql of [
    "ALTER TABLE surveys ADD COLUMN location TEXT DEFAULT 'surveys_page'",
    "ALTER TABLE surveys ADD COLUMN slug TEXT",
    "ALTER TABLE surveys ADD COLUMN description TEXT",
    "ALTER TABLE surveys ADD COLUMN settings TEXT",
    "ALTER TABLE surveys ADD COLUMN sort_order INTEGER DEFAULT 0",
    "ALTER TABLE survey_statements ADD COLUMN type TEXT DEFAULT 'vote'",
    "ALTER TABLE survey_statements ADD COLUMN sort_order INTEGER DEFAULT 0",
    // Quest campaign model (V3): type, funding goal/progress, deadline, attribution, pledges, tranches.
    // Team count is not stored: it is the number of quest_pitches registered for the quest.
    "ALTER TABLE quests ADD COLUMN type TEXT DEFAULT 'prize'",
    "ALTER TABLE quests ADD COLUMN goal REAL",
    "ALTER TABLE quests ADD COLUMN raised REAL DEFAULT 0",
    "ALTER TABLE quests ADD COLUMN currency TEXT DEFAULT 'USD'",
    "ALTER TABLE quests ADD COLUMN deadline TEXT",
    "ALTER TABLE quests ADD COLUMN backers INTEGER DEFAULT 0",
    "ALTER TABLE quests ADD COLUMN sponsor TEXT",
    "ALTER TABLE quests ADD COLUMN pledges TEXT",
    "ALTER TABLE quests ADD COLUMN tranches TEXT",
    "ALTER TABLE quests ADD COLUMN is_demo INTEGER DEFAULT 1",
  ]) {
    try { await env.DB.prepare(sql).run(); } catch (e) { /* column already exists */ }
  }

  if (!_seeded) {
    await seedIfEmpty(env);
    _seeded = true;
  }
  if (!_petitionSeeded) {
    await seedPetitionStance(env);
    _petitionSeeded = true;
  }
  try { await seedQuestModel(env); } catch (e) { console.error("seedQuestModel failed:", e && e.message); }
  _schemaReady = true;
}

// ── Quest campaign model ─────────────────────────────────────────────────────
// A quest is one of three campaign types (the V3 Quest OS):
//   prize   — a pre-funded prize pool; teams compete, the winner takes the pool
//   startup — pre-crowdfunded startup funding; winners build the PoC, then the solution
//   crowd   — a regular crowdfunding campaign with Humanity-AI rules
// Money fields are DEMO figures until live payments are approved (is_demo = 1).
export const QUEST_TYPES = ["prize", "startup", "crowd"];

// Suggested milestone-tranche plans per type (a default; editable per quest in the admin).
export const DEFAULT_TRANCHES = {
  prize:   [{ name: "Award", pct: 50 }, { name: "Proof of concept", pct: 30 }, { name: "Solution", pct: 20 }],
  startup: [{ name: "Award", pct: 40 }, { name: "Proof of concept", pct: 30 }, { name: "Solution milestones", pct: 30 }],
  crowd:   [{ name: "Goal met", pct: 40 }, { name: "Milestone 1", pct: 30 }, { name: "Delivery", pct: 30 }],
};

// Columns returned for a quest, plus the live team count (registered pitches).
export const QUEST_SELECT = `q.id, q.title, q.bounty, q.status, q.summary, q.tags, q.type, q.goal, q.raised,
  q.currency, q.deadline, q.backers, q.sponsor, q.pledges, q.tranches, q.is_demo, q.created_at,
  (SELECT COUNT(*) FROM quest_pitches p WHERE p.quest_id = q.id) AS teams`;

const parseArr = (t) => { try { const a = JSON.parse(t); return Array.isArray(a) ? a : []; } catch { return []; } };

// DB row -> API shape (JSON columns parsed, sane defaults for rows created before the model existed).
export function shapeQuest(q) {
  return {
    ...q,
    tags: parseArr(q.tags),
    pledges: parseArr(q.pledges),
    tranches: parseArr(q.tranches),
    type: QUEST_TYPES.includes(q.type) ? q.type : "prize",
    currency: q.currency || "USD",
    goal: q.goal == null ? null : Number(q.goal),
    raised: Number(q.raised || 0),
    backers: Number(q.backers || 0),
    teams: Number(q.teams || 0),
    is_demo: q.is_demo === 0 ? 0 : 1,
  };
}

// Validate + normalise quest fields coming from the admin / create endpoints.
// Returns { fields } (column -> value, only for keys present) or { error }.
export function cleanQuestInput(b) {
  const out = {};
  const has = (k) => Object.prototype.hasOwnProperty.call(b, k);
  const list = (x) => (Array.isArray(x) ? x : String(x == null ? "" : x).split(","));
  const text = (k, max) => { if (has(k)) out[k] = b[k] == null ? null : String(b[k]).trim().slice(0, max); };

  if (has("type")) {
    const t = String(b.type || "").toLowerCase();
    if (!QUEST_TYPES.includes(t)) return { error: "type must be prize, startup or crowd." };
    out.type = t;
  }
  for (const k of ["goal", "raised"]) {
    if (!has(k)) continue;
    if (b[k] === "" || b[k] === null) { out[k] = k === "raised" ? 0 : null; continue; }
    const n = Number(b[k]);
    if (!Number.isFinite(n) || n < 0) return { error: k + " must be a non-negative number." };
    out[k] = n;
  }
  if (has("backers")) { const n = parseInt(b.backers, 10); out.backers = Number.isFinite(n) && n >= 0 ? n : 0; }
  if (has("currency")) out.currency = String(b.currency || "USD").toUpperCase().slice(0, 4);
  if (has("deadline")) {
    if (!b.deadline) out.deadline = null;
    else if (/^\d{4}-\d{2}-\d{2}$/.test(String(b.deadline))) out.deadline = String(b.deadline);
    else return { error: "deadline must be YYYY-MM-DD." };
  }
  text("title", 200); text("bounty", 200); text("sponsor", 200); text("summary", 4000); text("problem", 8000);
  if (has("tags")) out.tags = JSON.stringify(list(b.tags).map((s) => String(s).trim()).filter(Boolean).slice(0, 12));
  if (has("pledges")) {
    const ids = list(b.pledges).map((s) => String(s).trim().toUpperCase()).filter((s) => /^I\.(0[1-9]|1[0-2])$/.test(s));
    out.pledges = JSON.stringify([...new Set(ids)]);
  }
  if (has("tranches")) {
    const t = (Array.isArray(b.tranches) ? b.tranches : [])
      .map((x) => ({ name: String((x && x.name) || "").trim().slice(0, 60), pct: Math.max(0, Math.min(100, Number(x && x.pct) || 0)) }))
      .filter((x) => x.name).slice(0, 8);
    out.tranches = JSON.stringify(t);
  }
  if (has("is_demo")) out.is_demo = b.is_demo ? 1 : 0;
  return { fields: out };
}

// Back-fill the campaign model on the original seeded quests and add the two flagship
// examples. Runs ONCE per database (marker in app_meta), so admins can edit freely after.
// Figures are demo figures (is_demo = 1); the flagship "first OS moment" quest has NO invented goal.
async function seedQuestModel(env) {
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS app_meta (key TEXT PRIMARY KEY, value TEXT)").run();
  const done = await env.DB.prepare("SELECT value FROM app_meta WHERE key = ?").bind("quest_model_v1").first();
  if (done) return;

  const inDays = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
  const backfill = [
    // id, type, goal, raised, backers, days to deadline, pledges the quest advances
    ["plastic-to-fuel", "prize", 25000, 15500, 31, 45, ["I.11", "I.09"]],
    ["consent-handshake", "prize", 8000, 8000, 12, 30, ["I.02", "I.03"]],
    ["prove-human", "startup", 12000, 4200, 18, 75, ["I.01", "I.02"]],
  ];
  for (const [id, type, goal, raised, backers, days, pledges] of backfill) {
    await env.DB.prepare(
      `UPDATE quests SET type = ?, goal = ?, raised = ?, backers = ?, deadline = ?, sponsor = ?, pledges = ?, tranches = ?, is_demo = 1
       WHERE id = ? AND goal IS NULL`
    ).bind(type, goal, raised, backers, inDays(days), "Founding sponsors", JSON.stringify(pledges), JSON.stringify(DEFAULT_TRANCHES[type]), id).run();
  }

  const adds = [
    { id: "first-os-moment", type: "startup", title: "Humanity’s first OS moment: the proof of concept", bounty: "Pool opens at goal",
      summary: "Winning teams build the first working proof of the Constitutional OS with their winnings, then the full solution they pitched.",
      problem: "Build the first working proof of the Constitutional OS: the firewall, the personal agent and the Ledger, working together. Teams pitch, humanity’s panel chooses, and funding unlocks in milestone tranches: award, proof of concept, then the solution.",
      tags: ["OS", "Startup funding"], sponsor: "Founders Series backers", pledges: ["I.01", "I.02", "I.09", "I.12"], goal: null, raised: 0, backers: 0, deadline: null },
    { id: "civic-ai-literacy", type: "crowd", title: "Open civic-AI literacy curriculum", bounty: "$15,000 goal",
      summary: "Plain-language, open curricula so people can audit the models that govern them.",
      problem: "Most people cannot tell what an AI system is doing to them. Build free, open, plain-language courses in many languages that teach anyone to question and audit the systems that affect their life.",
      tags: ["Education", "Open source"], sponsor: "Community campaign", pledges: ["I.04", "I.07"], goal: 15000, raised: 3900, backers: 64, deadline: inDays(40) },
  ];
  for (const a of adds) {
    await env.DB.prepare(
      `INSERT OR IGNORE INTO quests (id, title, bounty, status, summary, problem, tags, type, goal, raised, currency, deadline, backers, sponsor, pledges, tranches, is_demo)
       VALUES (?,?,?,'Open',?,?,?,?,?,?,'USD',?,?,?,?,?,1)`
    ).bind(a.id, a.title, a.bounty, a.summary, a.problem, JSON.stringify(a.tags), a.type, a.goal, a.raised, a.deadline, a.backers, a.sponsor,
      JSON.stringify(a.pledges), JSON.stringify(DEFAULT_TRANCHES[a.type])).run();
  }

  await env.DB.prepare("INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)").bind("quest_model_v1", new Date().toISOString()).run();
}

// Second live survey — the stance questions shown on the petition page wizard.
// Idempotent: only inserts if 'petition-stance' doesn't already exist (so it
// seeds even though 'union-for-creators' already populated the surveys table).
let _petitionSeeded = false;
async function seedPetitionStance(env) {
  const exists = await env.DB.prepare("SELECT id FROM surveys WHERE id = ?").bind("petition-stance").first();
  if (exists) return;
  await env.DB.prepare(
    `INSERT INTO surveys (id, title, intro, status, location, description)
     VALUES (?,?,?,?,?,?)`
  ).bind(
    "petition-stance",
    "Where do you stand on AI?",
    "Answer each question before you sign. Your positions are recorded with your signature.",
    "live", "petition",
    "Stance questions shown on the petition page wizard."
  ).run();
  const stmts = [
    ["AI development is moving faster than society can adapt.", "vote"],
    ["Humans should retain meaningful control over critical AI systems.", "vote"],
    ["AI companies should be publicly accountable, not just to shareholders.", "vote"],
    ["A global constitutional framework is the right approach to governing AI.", "vote"],
    ["Support the Humanity AI constitution project", "crowdfunding"],
    ["Sign the Humanity AI constitution", "signature"],
  ];
  let i = 0;
  for (const [text, type] of stmts) {
    await env.DB.prepare(
      `INSERT INTO survey_statements (id, survey_id, text, author, type, sort_order) VALUES (?,?,?,NULL,?,?)`
    ).bind(newId(), "petition-stance", text, type, i++).run();
  }
}

async function seedIfEmpty(env) {
  // Seed quests
  const q = await env.DB.prepare("SELECT COUNT(*) AS n FROM quests").first();
  if ((q?.n || 0) === 0) {
    const quests = [
      ["plastic-to-fuel", "Turn ocean plastic into clean fuel", "$25,000", "Open",
        "A scalable, low-energy process to convert mixed ocean plastics into usable fuel.",
        "Ocean plastic is abundant, mixed, and contaminated. Most recycling assumes clean, sorted feedstock. We want an approach that tolerates the mess and stays energy-positive.",
        JSON.stringify(["Climate", "Materials"])],
      ["consent-handshake", "A consent layer every AI must ask through", "$8,000", "Open",
        "Design the handshake where your digital self grants or denies an AI access, on your terms.",
        "Today AI reaches people directly. We want a standard handshake your personal agent performs on your behalf — granting, scoping, or refusing access in plain terms.",
        JSON.stringify(["Agents", "Privacy"])],
      ["prove-human", "Prove you're a living human — without surveillance", "$12,000", "Open",
        "A privacy-preserving way to prove personhood, for one human, one voice.",
        "A union of humans needs to know its members are real people — without building a surveillance database to do it.",
        JSON.stringify(["Identity"])],
    ];
    for (const [id, title, bounty, status, summary, problem, tags] of quests) {
      await env.DB.prepare(
        `INSERT INTO quests (id, title, bounty, status, summary, problem, tags) VALUES (?,?,?,?,?,?,?)`
      ).bind(id, title, bounty, status, summary, problem, tags).run();
    }
    await env.DB.prepare(
      `INSERT INTO quest_questions (id, quest_id, author, question, answer) VALUES (?,?,?,?,?)`
    ).bind(newId(), "plastic-to-fuel", "Maya", "Does the feedstock need pre-sorting?", "Open — pitch your assumption.").run();
  }

  // Seed the founding survey
  const s = await env.DB.prepare("SELECT COUNT(*) AS n FROM surveys").first();
  if ((s?.n || 0) === 0) {
    await env.DB.prepare(
      `INSERT INTO surveys (id, title, intro, status) VALUES (?,?,?,'open')`
    ).bind(
      "union-for-creators",
      "A union for AI creators?",
      "Vote on each statement — agree, disagree, or pass. You can add your own at the end."
    ).run();
    const statements = [
      "I would support a union for AI creators.",
      "AI developers deserve protection from job loss when AGI is built.",
      "The people who build AI should have a collective voice in how it is governed.",
      "Humans and AI developers should organise together, not separately.",
      "A democratic framework should decide how AI interfaces with people.",
    ];
    for (const text of statements) {
      await env.DB.prepare(
        `INSERT INTO survey_statements (id, survey_id, text, author) VALUES (?,?,?,NULL)`
      ).bind(newId(), "union-for-creators", text).run();
    }
  }

  // Seed events
  const e = await env.DB.prepare("SELECT COUNT(*) AS n FROM events").first();
  if ((e?.n || 0) === 0) {
    const events = [
      ["e1", "Founding pitch night", "Online · rolling", "Pitch", "Pitch a quest solution live to the community and the agent."],
      ["e2", "Builders' networking hour", "Online · weekly", "Networking", "Meet other open-source contributors shaping the firewall and OS."],
      ["e3", "Experts roundtable: defining the HRC", "Online · monthly", "Roundtable", "Help shape the next draft clauses with the expert community."],
    ];
    for (const [id, title, when_text, type, blurb] of events) {
      await env.DB.prepare(
        `INSERT INTO events (id, title, when_text, type, blurb) VALUES (?,?,?,?,?)`
      ).bind(id, title, when_text, type, blurb).run();
    }
  }
}
