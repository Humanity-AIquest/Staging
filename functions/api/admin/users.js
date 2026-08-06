/**
 * /api/admin/users
 * GET    — List all users (L1+)
 * PUT    — Update user status/role (varies by action)
 * DELETE — Not used (we ban, never delete)
 */
import { json, jsonError, optionsResponse, getUser, requireACL, newId } from "../_shared.js";

// GET /api/admin/users?status=active&role=user&page=1
export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const user = await getUser(request, env);
    const aclError = requireACL(user, 1);
    if (aclError) return aclError;

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const role = url.searchParams.get("role");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = 50;
    const offset = (page - 1) * limit;

    let query = "SELECT id, email, display_name, role, acl_level, status, ban_reason, created_at FROM users WHERE 1=1";
    const params = [];

    if (status) { query += " AND status = ?"; params.push(status); }
    if (role) { query += " AND role = ?"; params.push(role); }

    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const result = await env.DB.prepare(query).bind(...params).all();

    // Get total count
    let countQuery = "SELECT COUNT(*) as total FROM users WHERE 1=1";
    const countParams = [];
    if (status) { countQuery += " AND status = ?"; countParams.push(status); }
    if (role) { countQuery += " AND role = ?"; countParams.push(role); }
    const countResult = await env.DB.prepare(countQuery).bind(...countParams).first();

    return json({
      users: result.results || [],
      total: countResult?.total || 0,
      page,
      pages: Math.ceil((countResult?.total || 0) / limit),
    });
  } catch (err) {
    return jsonError("Failed to list users.");
  }
}

// PUT /api/admin/users — body: { user_id, action, reason?, acl_level? }
// Actions: ban, suspend, activate, set_admin, revoke_admin
export async function onRequestPut(context) {
  const { request, env } = context;
  try {
    const admin = await getUser(request, env);
    const body = await request.json();
    const { user_id, action, reason, acl_level } = body;

    if (!user_id || !action) return jsonError("user_id and action required.");

    // Get target user
    const target = await env.DB.prepare(
      "SELECT id, email, display_name, role, acl_level, status FROM users WHERE id = ?"
    ).bind(user_id).first();
    if (!target) return jsonError("User not found.");

    // Prevent self-modification
    if (admin.id === user_id) return jsonError("You cannot modify your own account.");

    // Prevent modifying higher-level admins
    if (target.role === "admin" && target.acl_level >= admin.acl_level) {
      return jsonError("You cannot modify an admin at your level or above.");
    }

    let update, logAction;

    switch (action) {
      case "ban": {
        const err = requireACL(admin, 4);
        if (err) return err;
        await env.DB.prepare("UPDATE users SET status = 'banned', ban_reason = ?, updated_at = datetime('now') WHERE id = ?")
          .bind(reason || "Violated community guidelines", user_id).run();
        // Kill their sessions
        await env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(user_id).run();
        logAction = `Banned user: ${reason || "No reason given"}`;
        break;
      }
      case "suspend": {
        const err = requireACL(admin, 4);
        if (err) return err;
        await env.DB.prepare("UPDATE users SET status = 'suspended', ban_reason = ?, updated_at = datetime('now') WHERE id = ?")
          .bind(reason || "Temporarily suspended", user_id).run();
        logAction = `Suspended user: ${reason || "No reason given"}`;
        break;
      }
      case "activate": {
        const err = requireACL(admin, 4);
        if (err) return err;
        await env.DB.prepare("UPDATE users SET status = 'active', ban_reason = NULL, updated_at = datetime('now') WHERE id = ?")
          .bind(user_id).run();
        logAction = "Activated user";
        break;
      }
      case "set_admin": {
        const err = requireACL(admin, 5);
        if (err) return err;
        const level = Math.min(Math.max(parseInt(acl_level) || 1, 1), 4); // L5 can only set up to L4
        await env.DB.prepare("UPDATE users SET role = 'admin', acl_level = ?, updated_at = datetime('now') WHERE id = ?")
          .bind(level, user_id).run();
        logAction = `Promoted to admin L${level}`;
        break;
      }
      case "revoke_admin": {
        const err = requireACL(admin, 5);
        if (err) return err;
        await env.DB.prepare("UPDATE users SET role = 'user', acl_level = 0, updated_at = datetime('now') WHERE id = ?")
          .bind(user_id).run();
        logAction = "Revoked admin access (returned to regular user)";
        break;
      }
      default:
        return jsonError("Invalid action. Use: ban, suspend, activate, set_admin, revoke_admin.");
    }

    // Ensure admin_actions table exists
    try {
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS admin_actions (
          id TEXT PRIMARY KEY,
          admin_id TEXT NOT NULL REFERENCES users(id),
          action_type TEXT NOT NULL,
          target_type TEXT,
          target_id TEXT,
          details TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();
    } catch (e) {
      // Table already exists
    }

    // Log admin action
    try {
      await env.DB.prepare(
        "INSERT INTO admin_actions (id, admin_id, action_type, target_type, target_id, details) VALUES (?, ?, ?, 'user', ?, ?)"
      ).bind(newId(), admin.id, action, user_id, logAction).run();
    } catch (e) {
      console.error('Failed to log admin action:', e);
      // Don't fail the operation if logging fails
    }

    return json({ success: true, action, user_id, message: logAction });
  } catch (err) {
    return jsonError("Failed to update user.");
  }
}

export async function onRequestOptions() { return optionsResponse(); }
