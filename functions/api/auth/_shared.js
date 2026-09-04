/**
 * Shared helpers for all API endpoints
 * - CORS headers
 * - JSON response builders
 * - Auth middleware (session cookie → user)
 * - Password hashing (Web Crypto API, no npm needed)
 */

// ─── CORS ────────────────────────────────────────────────────────────────────
export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

// ─── JSON Response Helpers ───────────────────────────────────────────────────
export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

export function jsonError(message, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status: 200, // Always 200 so frontend can parse
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

export function optionsResponse() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

// ─── Password Hashing (Web Crypto — works in Cloudflare Workers) ─────────────
export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, "0")).join("");
  const encoded = new TextEncoder().encode(saltHex + password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
  return `${saltHex}:${hashHex}`;
}

export async function verifyPassword(password, stored) {
  const [saltHex, expectedHash] = stored.split(":");
  const encoded = new TextEncoder().encode(saltHex + password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
  return hashHex === expectedHash;
}

// ─── Session Token Generation ────────────────────────────────────────────────
export function generateToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

// ─── Auth Middleware: Extract user from session cookie or header ──────────────
export async function getUser(request, env) {
  // Check for session token in cookie or Authorization header
  let token = null;

  // Try cookie first
  const cookieHeader = request.headers.get("Cookie") || "";
  const match = cookieHeader.match(/hrc_session=([a-f0-9]+)/);
  if (match) token = match[1];

  // Fall back to Authorization header (for API clients)
  if (!token) {
    const authHeader = request.headers.get("Authorization") || "";
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }
  }

  if (!token) return null;

  // Look up session in D1
  const session = await env.DB.prepare(
    "SELECT s.user_id, s.expires_at, u.email, u.display_name, u.role, u.acl_level, u.status FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > datetime('now')"
  ).bind(token).first();

  if (!session) return null;
  if (session.status === "banned") return null;

  return {
    id: session.user_id,
    email: session.email,
    display_name: session.display_name,
    role: session.role,
    acl_level: session.acl_level,
    status: session.status,
  };
}

// ─── ACL Check ───────────────────────────────────────────────────────────────
// Levels: 0=user, 1=viewer, 2=moderator, 3=editor, 4=manager, 5=super admin
export function requireACL(user, minLevel) {
  if (!user) return jsonError("Authentication required. Please log in.", 401);
  if (user.role !== "admin" || user.acl_level < minLevel) {
    return jsonError("You do not have permission for this action.", 403);
  }
  return null; // null means check passed
}

// ─── UUID Generator ──────────────────────────────────────────────────────────
export function newId() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}
