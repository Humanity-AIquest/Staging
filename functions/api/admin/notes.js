/**
 * /api/admin/notes
 * GET — List all conversation_notes (admin comments/actions) across conversations
 *       ?type=comment|next_action  (default: all)
 *       ?page=1
 */
import { json, jsonError, optionsResponse, getUser, requireACL } from "../_shared.js";

export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const user = await getUser(request, env);
    const aclError = requireACL(user, 1);
    if (aclError) return aclError;

    const url = new URL(request.url);
    const noteType = url.searchParams.get("type"); // 'comment' or 'next_action' (optional)
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = 100;
    const offset = (page - 1) * limit;

    // Ensure conversation_notes table exists
    try {
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
    } catch (e) { /* already exists */ }

    let query = `
      SELECT
        n.id, n.conversation_id, n.note, n.note_type, n.created_at,
        admin.display_name as admin_name,
        c.user_type, c.started_at, c.flagged, c.flag_category,
        cu.display_name as conv_user_name, cu.email as conv_user_email,
        (SELECT m.content FROM messages m
         WHERE m.conversation_id = n.conversation_id AND m.role = 'user'
         ORDER BY m.created_at ASC LIMIT 1) as first_message
      FROM conversation_notes n
      LEFT JOIN users admin ON n.admin_id = admin.id
      LEFT JOIN conversations c ON n.conversation_id = c.id
      LEFT JOIN users cu ON c.user_id = cu.id
      WHERE 1=1
    `;
    const params = [];

    if (noteType && ['comment', 'next_action'].includes(noteType)) {
      query += " AND n.note_type = ?";
      params.push(noteType);
    }

    query += " ORDER BY n.created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const result = await env.DB.prepare(query).bind(...params).all();

    return json({
      notes: result.results || [],
      page,
      type: noteType || 'all',
    });
  } catch (err) {
    return jsonError("Failed to list notes: " + err.message);
  }
}

export async function onRequestOptions() { return optionsResponse(); }
