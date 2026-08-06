/**
 * POST /api/auth/signup
 * Register a new user account
 * Body: { email, password, display_name }
 */
import { json, jsonError, optionsResponse, hashPassword, generateToken, newId, ensureAuthSchema } from "../_shared.js";

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // Ensure auth schema exists (idempotent)
    await ensureAuthSchema(env);

    const body = await request.json();
    const { email, password, display_name } = body;

    // Validate
    if (!email || !password) {
      return jsonError("Email and password are required.");
    }
    if (password.length < 8) {
      return jsonError("Password must be at least 8 characters.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonError("Please provide a valid email address.");
    }

    // Check if email already exists
    const existing = await env.DB.prepare(
      "SELECT id FROM users WHERE email = ?"
    ).bind(email.toLowerCase().trim()).first();

    if (existing) {
      return jsonError("An account with this email already exists. Please log in.");
    }

    // Create user
    const userId = newId();
    const passHash = await hashPassword(password);
    const name = (display_name || email.split("@")[0]).trim().slice(0, 50);
    const now = new Date().toISOString();

    await env.DB.prepare(
      "INSERT INTO users (id, email, password_hash, display_name, role, acl_level, status, created_at) VALUES (?, ?, ?, ?, 'user', 0, 'active', ?)"
    ).bind(userId, email.toLowerCase().trim(), passHash, name, now).run();

    // Create session
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

    await env.DB.prepare(
      "INSERT INTO sessions (id, user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)"
    ).bind(newId(), userId, token, expiresAt, now).run();

    // Set both Bearer token + session cookie for resilience
    const cookieHeader = `hrc_session=${token}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax`;

    return new Response(JSON.stringify({
      success: true,
      user: { id: userId, email: email.toLowerCase().trim(), display_name: name, role: "user", acl_level: 0 },
      token: token,
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Set-Cookie": cookieHeader,
      },
    });
  } catch (err) {
    return jsonError("Registration failed. Please try again.");
  }
}

export async function onRequestOptions() {
  return optionsResponse();
}
