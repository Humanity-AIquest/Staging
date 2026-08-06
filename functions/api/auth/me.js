/**
 * GET /api/auth/me
 * Returns current user info (if logged in), plus their ideas and recent conversations
 * Ideas/conversations queries wrapped in try/catch so missing tables don't break auth
 */
import { json, jsonError, optionsResponse, getUser, ensureAuthSchema } from "../_shared.js";

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    // Ensure auth schema exists (idempotent)
    await ensureAuthSchema(env);

    const user = await getUser(request, env);
    if (!user) {
      return json({ authenticated: false });
    }

    // Ensure ideas table exists (auto-migrate)
    const ideaCols = ['ledger_hash TEXT', 'prev_hash TEXT', 'clause_refs TEXT', 'conversation_id TEXT', 'tags TEXT'];
    try {
      await env.DB.prepare(`CREATE TABLE IF NOT EXISTS ideas (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        status TEXT DEFAULT 'submitted',
        clause_refs TEXT,
        conversation_id TEXT,
        ledger_hash TEXT,
        prev_hash TEXT,
        tags TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`).run();
    } catch(e) { /* already exists */ }
    for (const col of ideaCols) {
      try { await env.DB.prepare(`ALTER TABLE ideas ADD COLUMN ${col}`).run(); } catch(e) {}
    }

    // Fetch user's ideas — separate try/catch so auth still works if table is weird
    let ideas = [];
    try {
      const result = await env.DB.prepare(
        `SELECT id, title, status, clause_refs, created_at
         FROM ideas
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT 50`
      ).bind(user.id).all();
      ideas = result.results || [];

      // Attach latest visible comment to each idea
      for (let i = 0; i < ideas.length; i++) {
        try {
          const log = await env.DB.prepare(
            `SELECT comment, created_at FROM idea_status_log
             WHERE idea_id = ? AND visible_to_user = 1
             ORDER BY created_at DESC LIMIT 1`
          ).bind(ideas[i].id).first();
          ideas[i].latest_comment = log?.comment || null;
          ideas[i].last_updated = log?.created_at || null;
        } catch(e) { /* status log table may not exist */ }
      }
    } catch(e) {
      // ideas table genuinely doesn't exist yet — return empty array, don't break auth
      ideas = [];
    }

    // Fetch user's conversations + recent messages
    let conversations = [];
    try {
      const convResult = await env.DB.prepare(
        `SELECT id, mode, title, created_at, updated_at
         FROM conversations
         WHERE user_id = ?
         ORDER BY updated_at DESC
         LIMIT 20`
      ).bind(user.id).all();

      conversations = (convResult.results || []).map(conv => ({
        ...conv,
        messages: [], // Will be filled below if requested
      }));

      // For each conversation, get the latest message as a preview
      for (let i = 0; i < conversations.length; i++) {
        try {
          const msgPreview = await env.DB.prepare(
            `SELECT id, role, content, created_at
             FROM messages
             WHERE conversation_id = ?
             ORDER BY created_at DESC
             LIMIT 1`
          ).bind(conversations[i].id).first();
          if (msgPreview) {
            conversations[i].last_message = {
              role: msgPreview.role,
              preview: msgPreview.content.slice(0, 100), // First 100 chars
              timestamp: msgPreview.created_at,
            };
          }
        } catch (e) {
          // Messages table may not exist yet
        }
      }
    } catch (e) {
      // Conversations table doesn't exist yet — return empty array
      conversations = [];
    }

    return json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        role: user.role,
        acl_level: user.acl_level,
      },
      ideas,
      conversations,
    });
  } catch (err) {
    return jsonError("Failed to get user info: " + err.message);
  }
}

export async function onRequestOptions() {
  return optionsResponse();
}
