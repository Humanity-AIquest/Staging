/**
 * Shared schema + helpers for CONVERSATIONS (the agent chat log) and the
 * unified INTERACTIONS index.
 *
 * ROOT CAUSE THIS FIXES: the `conversations` and `messages` tables were never
 * created anywhere in code — chat.js assumed they already existed, so every
 * INSERT threw "no such table" and was silently swallowed. Result: agent
 * conversations (Dialogue, Co-Ideator, every mode) were recorded NOWHERE.
 *
 * This module creates them on demand (CREATE TABLE IF NOT EXISTS, idempotent —
 * harmless if they already exist) against the SAME D1 binding (env.DB) the rest
 * of the backend uses. Pattern mirrors functions/api/_movement.js.
 *
 * It also creates the `interactions` index: an append-only pointer log so a
 * survey vote, a signature, and an agent chat can all be browsed in one place
 * ("Interactions" admin tab) while the structured tables stay source of truth.
 */
import { newId } from "./_shared.js";

export async function ensureConversationSchema(env) {
  if (!env || !env.DB) return;

  // ── Conversations (one row per agent chat thread) ───────────────────────────
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    user_type TEXT DEFAULT 'anon',
    kind TEXT DEFAULT 'agent',
    mode TEXT,
    flagged INTEGER DEFAULT 0,
    flag_category TEXT,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();

  // ── Messages (one row per turn within a conversation) ───────────────────────
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    flagged INTEGER DEFAULT 0,
    flag_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();

  // ── Admin notes attached to a conversation ──────────────────────────────────
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS conversation_notes (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    admin_id TEXT NOT NULL,
    note TEXT NOT NULL,
    note_type TEXT DEFAULT 'comment',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();

  // ── Admin audit log (written by many endpoints, never created in code) ──────
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS admin_actions (
    id TEXT PRIMARY KEY,
    admin_id TEXT,
    action_type TEXT,
    target_type TEXT,
    target_id TEXT,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();

  // ── Unified interactions index (append-only pointer log) ────────────────────
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS interactions (
    id TEXT PRIMARY KEY,
    kind TEXT NOT NULL,
    user_id TEXT,
    participant TEXT,
    ref_type TEXT,
    ref_id TEXT,
    summary TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();

  // ── Indexes for the unified views (by user, by ref, by kind, by recency) ────
  for (const stmt of [
    `CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id)`,
    `CREATE INDEX IF NOT EXISTS idx_conv_user ON conversations(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_inter_participant ON interactions(participant)`,
    `CREATE INDEX IF NOT EXISTS idx_inter_ref ON interactions(ref_type, ref_id)`,
    `CREATE INDEX IF NOT EXISTS idx_inter_kind ON interactions(kind)`,
    `CREATE INDEX IF NOT EXISTS idx_inter_created ON interactions(created_at)`,
  ]) {
    try { await env.DB.prepare(stmt).run(); } catch (e) { /* index already exists */ }
  }
}

/**
 * Append one row to the interactions index. Never throws — interactions is a
 * convenience index, not source of truth, so a failure here must not break the
 * primary write (the chat reply, the vote, the signature).
 */
export async function logInteraction(env, { kind, user_id, participant, ref_type, ref_id, summary }) {
  if (!env || !env.DB) return;
  try {
    await env.DB.prepare(
      `INSERT INTO interactions (id, kind, user_id, participant, ref_type, ref_id, summary)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      newId(), kind, user_id || null,
      participant || user_id || "anon",
      ref_type || null, ref_id || null,
      (summary || "").slice(0, 280)
    ).run();
  } catch (e) { /* index write is best-effort */ }
}
