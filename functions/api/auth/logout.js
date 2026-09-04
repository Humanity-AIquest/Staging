/**
 * POST /api/auth/logout
 * Destroy the current session
 */
import { json, jsonError, optionsResponse } from "../_shared.js";

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // Extract token
    let token = null;
    const cookieHeader = request.headers.get("Cookie") || "";
    const match = cookieHeader.match(/hrc_session=([a-f0-9]+)/);
    if (match) token = match[1];

    const authHeader = request.headers.get("Authorization") || "";
    if (!token && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }

    if (token) {
      await env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
    }

    return json({ success: true, message: "Logged out successfully." });
  } catch (err) {
    return jsonError("Logout failed.");
  }
}

export async function onRequestOptions() {
  return optionsResponse();
}
