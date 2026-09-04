/**
 * /api/admin/comments
 * GET    — View messages filtered by anon/registered (L1+)
 * DELETE — Delete anon or registered user comments (L4+)
 */
import { json, jsonError, optionsResponse, getUser, requireACL, newId } from "../_shared.js";

// GET /api/admin/comments?type=anon|registered&page=1
export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const user = await getUser(request, env);
    const aclError = requireACL(user, 1);
    if (aclError) return aclError;

    const url = new URL(request.url);
    const type = url.searchParams.get("type"); // anon or registered
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = 50;
    const offset = (page - 1) * limit;

    let query = `SELECT m.id, m.content, m.role, m.created_at, m.flagged, m.flag_reason,
                        c.user_type, c.id as conversation_id,
                        u.email, u.display_name
                 FROM messages m
                 JOIN conversations c ON m.conversation_id = c.id
                 LEFT JOIN users u ON c.user_id = u.id
                 WHERE m.role = 'user'`;
    const params = [];

    if (type === "anon") { query += " AND c.user_type = 'anon'"; }
    if (type === "registered") { query += " AND c.user_type = 'registered'"; }

    query += " ORDER BY m.created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const result = await env.DB.prepare(query).bind(...params).all();

    return json({ comments: result.results || [], page });
  } catch (err) {
    return jsonError("Failed to load comments.");
  }
}

// DELETE /api/admin/comments — body: { message_ids: [], reason }
export async function onRequestDelete(context) {
  const { request, env } = context;
  try {
    const admin = await getUser(request, env);
    const aclError = requireACL(admin, 4);
    if (aclError) return aclError;

    const body = await request.json();
    const { message_ids, reason } = body;

    if (!Array.isArray(message_ids) || message_ids.length === 0) {
      return jsonError("message_ids array required.");
    }

    let deleted = 0;
    for (const msgId of message_ids.slice(0, 100)) { // Max 100 at a time
      await env.DB.prepare(
        "UPDATE messages SET content = '[Deleted by admin]', flagged = 1, flag_reason = ? WHERE id = ?"
      ).bind(reason || "Deleted by admin", msgId).run();
      deleted++;
    }

    // Log action
    await env.DB.prepare(
      "INSERT INTO admin_actions (id, admin_id, action_type, target_type, target_id, details) VALUES (?, ?, 'delete_comments', 'messages', ?, ?)"
    ).bind(newId(), admin.id, message_ids.join(","), `Deleted ${deleted} comments: ${reason || "No reason"}`).run();

    return json({ success: true, deleted, message: `${deleted} comment(s) removed.` });
  } catch (err) {
    return jsonError("Failed to delete comments.");
  }
}

export async function onRequestOptions() { return optionsResponse(); }
