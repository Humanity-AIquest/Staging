/**
 * /api/admin/ideas
 * GET — List all ideas with filters (L1+)
 * PUT — Update idea status + admin comment (L3+) — notifies user
 */
import { json, jsonError, optionsResponse, getUser, requireACL, newId } from "../_shared.js";

// GET /api/admin/ideas?status=submitted&page=1
export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const user = await getUser(request, env);
    const aclError = requireACL(user, 1);
    if (aclError) return aclError;

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const userId = url.searchParams.get("user_id");
    const page = parseInt(url.searchParams.get("page") || "1");
    const id = url.searchParams.get("id");
    const limit = 50;
    const offset = (page - 1) * limit;

    // Single idea with full history
    if (id) {
      const idea = await env.DB.prepare(
        `SELECT i.*, u.email, u.display_name
         FROM ideas i LEFT JOIN users u ON i.user_id = u.id
         WHERE i.id = ?`
      ).bind(id).first();

      if (!idea) return jsonError("Idea not found.");

      const history = await env.DB.prepare(
        `SELECT isl.*, a.display_name as admin_name
         FROM idea_status_log isl LEFT JOIN users a ON isl.admin_id = a.id
         WHERE isl.idea_id = ? ORDER BY isl.created_at ASC`
      ).bind(id).all();

      return json({ idea, status_history: history.results || [] });
    }

    // List ideas
    let query = `SELECT i.id, i.title, i.content, i.clause_refs, i.status, i.created_at, i.ledger_hash,
                        u.email, u.display_name
                 FROM ideas i LEFT JOIN users u ON i.user_id = u.id WHERE 1=1`;
    const params = [];

    if (status) { query += " AND i.status = ?"; params.push(status); }
    if (userId) { query += " AND i.user_id = ?"; params.push(userId); }

    query += " ORDER BY i.created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const result = await env.DB.prepare(query).bind(...params).all();

    const countQuery = `SELECT COUNT(*) as total FROM ideas WHERE 1=1${status ? " AND status = ?" : ""}`;
    const countParams = status ? [status] : [];
    const countResult = await env.DB.prepare(countQuery).bind(...countParams).first();

    return json({
      ideas: result.results || [],
      total: countResult?.total || 0,
      page,
    });
  } catch (err) {
    return jsonError("Failed to list ideas.");
  }
}

// PUT /api/admin/ideas — body: { idea_id, status, comment, visible_to_user }
export async function onRequestPut(context) {
  const { request, env } = context;
  try {
    const admin = await getUser(request, env);

    const body = await request.json();
    const { idea_id, status, comment, visible_to_user } = body;

    if (!idea_id || !status) return jsonError("idea_id and status required.");

    const validStatuses = ["submitted", "under_review", "accepted", "implemented", "deferred", "rejected", "deleted"];
    if (!validStatuses.includes(status)) return jsonError(`Invalid status. Use: ${validStatuses.join(", ")}`);

    // Deletion requires L4+
    if (status === "deleted") {
      const err = requireACL(admin, 4);
      if (err) return err;
    } else {
      const err = requireACL(admin, 3);
      if (err) return err;
    }

    // Get current idea
    const idea = await env.DB.prepare("SELECT id, status, user_id FROM ideas WHERE id = ?").bind(idea_id).first();
    if (!idea) return jsonError("Idea not found.");

    const oldStatus = idea.status;

    // Update idea status
    await env.DB.prepare("UPDATE ideas SET status = ? WHERE id = ?").bind(status, idea_id).run();

    // Log status change (visible to user by default)
    const logComment = comment || `Status changed from ${oldStatus} to ${status}`;
    await env.DB.prepare(
      "INSERT INTO idea_status_log (id, idea_id, old_status, new_status, admin_id, comment, visible_to_user) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).bind(newId(), idea_id, oldStatus, status, admin.id, logComment, visible_to_user !== false ? 1 : 0).run();

    // Log admin action
    await env.DB.prepare(
      "INSERT INTO admin_actions (id, admin_id, action_type, target_type, target_id, details) VALUES (?, ?, ?, 'idea', ?, ?)"
    ).bind(newId(), admin.id, `idea_${status}`, idea_id, logComment).run();

    return json({
      success: true,
      idea_id,
      old_status: oldStatus,
      new_status: status,
      message: `Idea status updated. ${visible_to_user !== false ? "User will be notified." : "Note is internal only."}`,
    });
  } catch (err) {
    return jsonError("Failed to update idea.");
  }
}

// POST /api/admin/ideas — body: { idea_id, action: 'set_tags', tags: 'tag1,tag2' }
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const user = await getUser(request, env);
    const aclError = requireACL(user, 2);
    if (aclError) return aclError;

    const body = await request.json();
    const { idea_id, action, tags } = body;

    if (!idea_id) return jsonError("idea_id required.");

    if (action === 'set_tags') {
      // Auto-migrate tags column
      try {
        await env.DB.prepare("ALTER TABLE ideas ADD COLUMN tags TEXT").run();
      } catch (e) { /* column already exists */ }

      const tagsStr = (tags || '').toString().trim();
      await env.DB.prepare("UPDATE ideas SET tags = ? WHERE id = ?")
        .bind(tagsStr || null, idea_id).run();

      return json({ success: true, idea_id, tags: tagsStr });
    }

    return jsonError("Invalid action. Use: set_tags");
  } catch (err) {
    return jsonError("Failed to update idea: " + err.message);
  }
}

export async function onRequestOptions() { return optionsResponse(); }
