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

export async function ensureMovementSchema(env) {
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
