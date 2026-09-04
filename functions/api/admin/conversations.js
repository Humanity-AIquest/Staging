/**
 * /api/admin/conversations
 * GET — List conversations with filters (L1+), or get single conversation with messages
 * POST — Flag/unflag/delete a conversation, add admin notes (L2+)
 */
import { json, jsonError, optionsResponse, getUser, requireACL, newId } from "../_shared.js";
import { ensureConversationSchema } from "../_conversations.js";

// Auto-migrate: guarantee conversations/messages/notes/interactions exist, then
// backfill any columns added after the original bootstrap.
async function ensureSchema(env) {
  // Base tables (idempotent). This is what stops the admin screen from erroring
  // when the conversations table was never created.
  try { await ensureConversationSchema(env); } catch (e) { /* best-effort */ }
  // Backfill columns on pre-existing tables that the base CREATE won't add.
  for (const col of ["flag_category TEXT", "kind TEXT DEFAULT 'agent'", "mode TEXT"]) {
    try { await env.DB.prepare(`ALTER TABLE conversations ADD COLUMN ${col}`).run(); } catch (e) { /* exists */ }
  }
}

// GET /api/admin/conversations?filter=all|flagged|anonymous|registered
// GET /api/admin/conversations?id=<conv_id> — single conversation with full messages
export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    await ensureSchema(env);
    const user = await getUser(request, env);
    const aclError = requireACL(user, 1);
    if (aclError) return aclError;

    const url = new URL(request.url);
    const filter = url.searchParams.get("filter");
    const page = parseInt(url.searchParams.get("page") || "1");
    const id = url.searchParams.get("id"); // single conversation
    const limit = 50;
    const offset = (page - 1) * limit;

    // Single conversation with messages
    if (id) {
      const conv = await env.DB.prepare(
        `SELECT c.*, u.email, u.display_name
         FROM conversations c LEFT JOIN users u ON c.user_id = u.id
         WHERE c.id = ?`
      ).bind(id).first();

      if (!conv) return jsonError("Conversation not found.");

      const msgs = await env.DB.prepare(
        "SELECT id, role, content, flagged, flag_reason, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC"
      ).bind(id).all();

      // Get admin notes for this conversation
      const notes = await env.DB.prepare(
        `SELECT n.id, n.note, n.note_type, n.created_at, u.display_name as admin_name
         FROM conversation_notes n LEFT JOIN users u ON n.admin_id = u.id
         WHERE n.conversation_id = ? ORDER BY n.created_at ASC`
      ).bind(id).all().catch(() => ({ results: [] }));

      return json({
        conversation: conv,
        messages: msgs.results || [],
        notes: notes.results || [],
      });
    }

    // List conversations
    let query = `SELECT c.id, c.user_id, c.user_type, c.kind, c.mode, c.started_at, c.flagged, c.flag_category,
                        u.email, u.display_name as user_name,
                        (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) as message_count,
                        (SELECT m.content FROM messages m WHERE m.conversation_id = c.id AND m.role = 'user' ORDER BY m.created_at ASC LIMIT 1) as first_message
                 FROM conversations c LEFT JOIN users u ON c.user_id = u.id WHERE 1=1`;
    const params = [];

    if (filter === "flagged") { query += " AND c.flagged = 1"; }
    else if (filter === "anonymous") { query += " AND c.user_type = 'anon'"; }
    else if (filter === "registered") { query += " AND c.user_type = 'registered'"; }

    query += " ORDER BY c.started_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const result = await env.DB.prepare(query).bind(...params).all();

    return json({
      conversations: result.results || [],
      page,
    });
  } catch (err) {
    return jsonError("Failed to list conversations.");
  }
}

// POST /api/admin/conversations
// Actions: flag, unflag, delete, add_note, add_action
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    await ensureSchema(env);
    const user = await getUser(request, env);
    const aclError = requireACL(user, 2);
    if (aclError) return aclError;

    const body = await request.json();
    const { conversation_id, action } = body;

    if (!conversation_id) return jsonError("conversation_id required.");

    switch (action) {
      case "flag": {
        // flag_category: 'process_hrc', 'more_info', 'warn_user', 'suspend_user'
        const category = body.flag_category || "general";
        await env.DB.prepare(
          "UPDATE conversations SET flagged = 1, flag_category = ? WHERE id = ?"
        ).bind(category, conversation_id).run();

        await env.DB.prepare(
          "INSERT INTO admin_actions (id, admin_id, action_type, target_type, target_id, details) VALUES (?, ?, 'flag', 'conversation', ?, ?)"
        ).bind(newId(), user.id, conversation_id, `Flag: ${category}`).run();

        return json({ success: true, message: `Flagged as "${category}"` });
      }

      case "unflag": {
        await env.DB.prepare(
          "UPDATE conversations SET flagged = 0, flag_category = NULL WHERE id = ?"
        ).bind(conversation_id).run();

        await env.DB.prepare(
          "INSERT INTO admin_actions (id, admin_id, action_type, target_type, target_id, details) VALUES (?, ?, 'unflag', 'conversation', ?, 'Unflagged')"
        ).bind(newId(), user.id, conversation_id).run();

        return json({ success: true, message: "Unflagged" });
      }

      case "delete": {
        // Requires L4+
        const delErr = requireACL(user, 4);
        if (delErr) return delErr;

        await env.DB.prepare("DELETE FROM messages WHERE conversation_id = ?").bind(conversation_id).run();
        await env.DB.prepare("DELETE FROM conversations WHERE id = ?").bind(conversation_id).run();

        await env.DB.prepare(
          "INSERT INTO admin_actions (id, admin_id, action_type, target_type, target_id, details) VALUES (?, ?, 'delete', 'conversation', ?, 'Deleted conversation')"
        ).bind(newId(), user.id, conversation_id).run();

        return json({ success: true, message: "Conversation deleted" });
      }

      case "add_note": {
        const { note, note_type } = body; // note_type: 'comment' or 'next_action'
        if (!note) return jsonError("Note text is required.");

        // Create conversation_notes table if it doesn't exist
        await env.DB.prepare(
          `CREATE TABLE IF NOT EXISTS conversation_notes (
            id TEXT PRIMARY KEY,
            conversation_id TEXT NOT NULL,
            admin_id TEXT NOT NULL,
            note TEXT NOT NULL,
            note_type TEXT DEFAULT 'comment',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )`
        ).run();

        await env.DB.prepare(
          "INSERT INTO conversation_notes (id, conversation_id, admin_id, note, note_type) VALUES (?, ?, ?, ?, ?)"
        ).bind(newId(), conversation_id, user.id, note, note_type || "comment").run();

        return json({ success: true, message: "Note added" });
      }

      default:
        return jsonError("Invalid action. Use: flag, unflag, delete, add_note");
    }
  } catch (err) {
    return jsonError("Failed to update conversation.");
  }
}

// Keep PUT for backwards compat
export async function onRequestPut(context) {
  const { request, env } = context;
  try {
    const user = await getUser(request, env);
    const aclError = requireACL(user, 2);
    if (aclError) return aclError;

    const body = await request.json();
    const { conversation_id, flagged } = body;
    if (!conversation_id) return jsonError("conversation_id required.");

    await env.DB.prepare("UPDATE conversations SET flagged = ? WHERE id = ?")
      .bind(flagged ? 1 : 0, conversation_id).run();

    await env.DB.prepare(
      "INSERT INTO admin_actions (id, admin_id, action_type, target_type, target_id, details) VALUES (?, ?, ?, 'conversation', ?, ?)"
    ).bind(newId(), user.id, flagged ? "flag" : "unflag", conversation_id, flagged ? "Flagged" : "Unflagged").run();

    return json({ success: true });
  } catch (err) {
    return jsonError("Failed to update conversation.");
  }
}

export async function onRequestOptions() { return optionsResponse(); }
