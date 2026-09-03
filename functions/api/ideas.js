/**
 * /api/ideas
 * POST — Submit a new idea (registered users only)
 * GET  — Get my ideas with status history
 */
import { json, jsonError, optionsResponse, getUser, newId } from "./_shared.js";
import { ensureConversationSchema, logInteraction } from "./_conversations.js";

// ─── Auto-migrate ideas table ─────────────────────────────────────────────────
async function ensureIdeasSchema(env) {
  const cols = ['ledger_hash TEXT', 'prev_hash TEXT', 'clause_refs TEXT', 'conversation_id TEXT', 'tags TEXT'];
  for (const col of cols) {
    try { await env.humanity_ai_db_staging.prepare(`ALTER TABLE ideas ADD COLUMN ${col}`).run(); } catch (e) { /* already exists */ }
  }
  // Ensure idea_status_log table exists
  try {
    await env.humanity_ai_db_staging.prepare(`CREATE TABLE IF NOT EXISTS idea_status_log (
      id TEXT PRIMARY KEY,
      idea_id TEXT NOT NULL,
      old_status TEXT,
      new_status TEXT NOT NULL,
      admin_id TEXT,
      comment TEXT,
      visible_to_user INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`).run();
  } catch (e) { /* already exists */ }
}

// ─── SHA-256 hash for immutable ledger ────────────────────────────────────────
async function computeLedgerHash(content, prevHash) {
  const payload = `${prevHash || "GENESIS"}|${content}|${new Date().toISOString()}`;
  const encoded = new TextEncoder().encode(payload);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// ─── POST: Submit Idea ────────────────────────────────────────────────────────
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    await ensureIdeasSchema(env);

    const user = await getUser(request, env);
    if (!user) {
      return jsonError("You must be logged in to submit an idea. Your contribution matters — please create an account so we can attribute your input per Clause I.1.");
    }

    const body = await request.json();
    const { title, content, clause_refs, conversation_id } = body;

    if (!title || !content) {
      return jsonError("Please provide a title and description for your idea.");
    }
    if (title.length > 200) {
      return jsonError("Title must be 200 characters or less.");
    }
    if (content.length > 5000) {
      return jsonError("Idea description must be 5000 characters or less.");
    }

    // Get previous hash for chain integrity
    let prevHash = null;
    try {
      const lastIdea = await env.humanity_ai_db_staging.prepare(
        "SELECT ledger_hash FROM ideas ORDER BY created_at DESC LIMIT 1"
      ).first();
      prevHash = lastIdea?.ledger_hash || null;
    } catch (e) { /* ledger_hash column may not exist yet */ }

    // Compute hash
    let ledgerHash = null;
    try {
      ledgerHash = await computeLedgerHash(
        JSON.stringify({ title, content, user_id: user.id }),
        prevHash
      );
    } catch (e) { /* hash failure is non-critical */ }

    const ideaId = newId();

    await env.humanity_ai_db_staging.prepare(
      `INSERT INTO ideas (id, user_id, conversation_id, title, content, clause_refs, status, ledger_hash, prev_hash)
       VALUES (?, ?, ?, ?, ?, ?, 'submitted', ?, ?)`
    ).bind(
      ideaId, user.id, conversation_id || null,
      title.trim(), content.trim(),
      clause_refs || null,
      ledgerHash, prevHash
    ).run();

    // Log initial status
    try {
      await env.humanity_ai_db_staging.prepare(
        `INSERT INTO idea_status_log (id, idea_id, old_status, new_status, comment, visible_to_user)
         VALUES (?, ?, NULL, 'submitted', 'Your idea has been received. Thank you for contributing to the HRC.', 1)`
      ).bind(newId(), ideaId).run();
    } catch (e) { /* log failure is non-critical */ }

    // Index the idea so it appears on the member's cross-source timeline.
    try {
      await ensureConversationSchema(env);
      await logInteraction(env, {
        kind: "idea", user_id: user.id, participant: (user.email || user.id),
        ref_type: "idea", ref_id: ideaId, summary: "Submitted idea: " + title.trim(),
      });
    } catch (e) { /* index write is best-effort */ }

    return json({
      success: true,
      idea: {
        id: ideaId,
        title: title.trim(),
        status: "submitted",
        ledger_hash: ledgerHash,
        message: "Your idea has been recorded on the immutable ledger per Clause I.1. You can track its status in your account."
      }
    });
  } catch (err) {
    return jsonError("Failed to submit idea: " + err.message);
  }
}

// ─── GET: My Ideas ────────────────────────────────────────────────────────────
export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    await ensureIdeasSchema(env);

    const user = await getUser(request, env);
    if (!user) {
      return jsonError("Please log in to view your ideas.");
    }

    const ideas = await env.humanity_ai_db_staging.prepare(
      `SELECT id, title, content, clause_refs, status, ledger_hash, created_at
       FROM ideas
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 100`
    ).bind(user.id).all();

    // Get status history for each idea
    const ideasWithHistory = [];
    for (const idea of ideas.results || []) {
      let history = { results: [] };
      try {
        history = await env.humanity_ai_db_staging.prepare(
          `SELECT new_status, comment, visible_to_user, created_at
           FROM idea_status_log
           WHERE idea_id = ? AND visible_to_user = 1
           ORDER BY created_at ASC`
        ).bind(idea.id).all();
      } catch (e) { /* table may not have been created yet */ }

      ideasWithHistory.push({
        ...idea,
        status_history: history.results || [],
      });
    }

    return json({ ideas: ideasWithHistory });
  } catch (err) {
    return jsonError("Failed to load ideas: " + err.message);
  }
}

export async function onRequestOptions() {
  return optionsResponse();
}
