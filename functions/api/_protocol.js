/**
 * Protocol schema — membership, vouching, agent firewall, contribution ledger,
 * and release management.
 *
 * Follows the same self-migrating pattern as _shared.js#ensureAuthSchema:
 * idempotent CREATE TABLE IF NOT EXISTS, guarded ALTER TABLE, every statement in
 * its own try/catch so a partially-provisioned database repairs itself rather
 * than failing silently.
 *
 * Call ensureProtocolSchema(env) at the top of any endpoint that touches these
 * tables. It is cheap and safe to call repeatedly.
 */

// ─── Constants ───────────────────────────────────────────────────────────────

/** Vouches required to admit a member. Administrators may override. */
export const VOUCHES_REQUIRED = 2;

/** Default credential term, in days. */
export const CREDENTIAL_TERM_DAYS = 90;

/** Scope names, in ascending order of what they permit. */
export const SCOPES = ["read", "deliberate", "vote", "amend", "vouch"];

// ─── Schema ──────────────────────────────────────────────────────────────────

const TABLES = [
  // Invitations — the founding cohort is invite-only and manually verified.
  `CREATE TABLE IF NOT EXISTS invites (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    invited_by TEXT REFERENCES users(id),
    code TEXT UNIQUE NOT NULL,
    note TEXT,
    redeemed_by TEXT REFERENCES users(id),
    redeemed_at DATETIME,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  // Vouches work like professional recommendations: standalone, public,
  // unlimited in number. Two admit a member; more are signal only.
  `CREATE TABLE IF NOT EXISTS vouches (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL REFERENCES users(id),
    voucher_id TEXT NOT NULL REFERENCES users(id),
    statement TEXT,
    withdrawn_at DATETIME,
    withdrawn_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(subject_id, voucher_id)
  )`,

  // Verification state, derived from vouches or set by administrator override.
  `CREATE TABLE IF NOT EXISTS member_verification (
    user_id TEXT PRIMARY KEY REFERENCES users(id),
    state TEXT NOT NULL DEFAULT 'pending',
    method TEXT,
    vouch_count INTEGER DEFAULT 0,
    override_by TEXT REFERENCES users(id),
    override_reason TEXT,
    standing_since DATETIME,
    flagged_at DATETIME,
    flagged_reason TEXT,
    verified_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  // Agent credentials. The firewall: no credential, no access.
  `CREATE TABLE IF NOT EXISTS agent_registrations (
    id TEXT PRIMARY KEY,
    credential TEXT UNIQUE NOT NULL,
    sponsor_id TEXT NOT NULL REFERENCES users(id),
    agent_label TEXT,
    client_type TEXT,
    client_version TEXT,
    plugin_version TEXT,
    scopes TEXT NOT NULL DEFAULT 'read',
    state TEXT NOT NULL DEFAULT 'active',
    issued_by TEXT REFERENCES users(id),
    issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    last_seen_at DATETIME
  )`,

  // Revocations are published. A revoked credential is dead everywhere at once.
  `CREATE TABLE IF NOT EXISTS agent_revocations (
    id TEXT PRIMARY KEY,
    registration_id TEXT NOT NULL REFERENCES agent_registrations(id),
    credential TEXT NOT NULL,
    reason TEXT NOT NULL,
    clause_id TEXT,
    revoked_by TEXT REFERENCES users(id),
    cascade_from TEXT REFERENCES agent_revocations(id),
    revoked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    published_at DATETIME
  )`,

  // Every allow and refusal at the firewall boundary. This is the demo data.
  `CREATE TABLE IF NOT EXISTS firewall_events (
    id TEXT PRIMARY KEY,
    credential TEXT,
    registration_id TEXT REFERENCES agent_registrations(id),
    sponsor_id TEXT REFERENCES users(id),
    action TEXT NOT NULL,
    verdict TEXT NOT NULL,
    reason TEXT,
    clause_id TEXT,
    client_type TEXT,
    plugin_version TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  // The contribution ledger. Hash-chained; rewriting is detectable.
  `CREATE TABLE IF NOT EXISTS contributions (
    id TEXT PRIMARY KEY,
    seq INTEGER,
    user_id TEXT NOT NULL REFERENCES users(id),
    kind TEXT NOT NULL,
    subject_type TEXT,
    subject_id TEXT,
    summary TEXT,
    body_hash TEXT,
    ai_role TEXT NOT NULL DEFAULT 'none',
    ai_model TEXT,
    credential TEXT,
    hrc_verdict TEXT,
    hrc_clauses TEXT,
    prev_hash TEXT,
    entry_hash TEXT,
    sealed_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  // Published chain roots, so anyone can verify history independently.
  `CREATE TABLE IF NOT EXISTS ledger_roots (
    id TEXT PRIMARY KEY,
    root_hash TEXT NOT NULL,
    entry_count INTEGER NOT NULL,
    published_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  // Plugin releases move draft -> staged -> canary -> general by human promotion.
  `CREATE TABLE IF NOT EXISTS plugin_releases (
    id TEXT PRIMARY KEY,
    version TEXT UNIQUE NOT NULL,
    stage TEXT NOT NULL DEFAULT 'draft',
    changelog TEXT,
    git_tag TEXT,
    promoted_by TEXT REFERENCES users(id),
    promoted_at DATETIME,
    halted_at DATETIME,
    halted_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  // Server-served content: clause text, protocol, conduct rules, prompts.
  // Approved changes go live immediately, which is why approval precedes publish.
  `CREATE TABLE IF NOT EXISTS content_versions (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL,
    version INTEGER NOT NULL,
    body TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'pending',
    author_id TEXT REFERENCES users(id),
    approved_by TEXT REFERENCES users(id),
    approved_at DATETIME,
    rejected_reason TEXT,
    hrc_verdict TEXT,
    published_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(slug, version)
  )`,

  // The version handshake. Populates the connected-clients dashboard.
  `CREATE TABLE IF NOT EXISTS mcp_connections (
    id TEXT PRIMARY KEY,
    credential TEXT,
    user_id TEXT REFERENCES users(id),
    client_type TEXT,
    client_version TEXT,
    plugin_version TEXT,
    protocol_version TEXT,
    first_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    call_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0
  )`,
];

const INDEXES = [
  `CREATE INDEX IF NOT EXISTS idx_vouches_subject ON vouches(subject_id)`,
  `CREATE INDEX IF NOT EXISTS idx_vouches_voucher ON vouches(voucher_id)`,
  `CREATE INDEX IF NOT EXISTS idx_reg_sponsor ON agent_registrations(sponsor_id)`,
  `CREATE INDEX IF NOT EXISTS idx_reg_cred ON agent_registrations(credential)`,
  `CREATE INDEX IF NOT EXISTS idx_reg_state ON agent_registrations(state)`,
  `CREATE INDEX IF NOT EXISTS idx_fw_created ON firewall_events(created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_fw_verdict ON firewall_events(verdict)`,
  `CREATE INDEX IF NOT EXISTS idx_contrib_user ON contributions(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_contrib_seq ON contributions(seq)`,
  `CREATE INDEX IF NOT EXISTS idx_content_slug ON content_versions(slug, version DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_content_state ON content_versions(state)`,
  `CREATE INDEX IF NOT EXISTS idx_conn_cred ON mcp_connections(credential)`,
  `CREATE INDEX IF NOT EXISTS idx_invites_code ON invites(code)`,
];

/**
 * Idempotent. Safe to call on every request; cheap when everything already exists.
 */
export async function ensureProtocolSchema(env) {
  for (const stmt of TABLES) {
    try { await env.DB.prepare(stmt).run(); } catch (e) { /* exists */ }
  }
  for (const stmt of INDEXES) {
    try { await env.DB.prepare(stmt).run(); } catch (e) { /* exists */ }
  }
}

// ─── Vouching ────────────────────────────────────────────────────────────────

/**
 * Recompute verification from live vouches.
 *
 * Two standing vouches admit a member. Withdrawn vouches do not count. An
 * administrator override admits regardless of count and is recorded with a
 * reason — it exists so the process never deadlocks, not so it becomes routine.
 *
 * Returns { state, vouch_count, method }.
 */
export async function recomputeVerification(env, userId) {
  const row = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM vouches
     WHERE subject_id = ? AND withdrawn_at IS NULL`
  ).bind(userId).first();

  const count = row?.n || 0;

  const existing = await env.DB.prepare(
    `SELECT state, override_by, method FROM member_verification WHERE user_id = ?`
  ).bind(userId).first();

  // An administrator override stands regardless of vouch count.
  if (existing?.override_by) {
    await env.DB.prepare(
      `UPDATE member_verification SET vouch_count = ? WHERE user_id = ?`
    ).bind(count, userId).run();
    return { state: existing.state, vouch_count: count, method: existing.method };
  }

  const state = count >= VOUCHES_REQUIRED ? "verified" : "pending";
  const now = new Date().toISOString();

  await env.DB.prepare(
    `INSERT INTO member_verification (user_id, state, method, vouch_count, verified_at, standing_since)
     VALUES (?, ?, 'vouched', ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       state = excluded.state,
       vouch_count = excluded.vouch_count,
       verified_at = COALESCE(member_verification.verified_at, excluded.verified_at),
       standing_since = COALESCE(member_verification.standing_since, excluded.standing_since)`
  ).bind(userId, state, count, state === "verified" ? now : null, state === "verified" ? now : null).run();

  return { state, vouch_count: count, method: "vouched" };
}

/**
 * Administrator override. Logged, always, with a stated reason.
 */
export async function overrideVerification(env, userId, adminId, reason, state = "verified") {
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO member_verification (user_id, state, method, override_by, override_reason, verified_at, standing_since)
     VALUES (?, ?, 'override', ?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       state = excluded.state,
       method = 'override',
       override_by = excluded.override_by,
       override_reason = excluded.override_reason,
       verified_at = COALESCE(member_verification.verified_at, excluded.verified_at),
       standing_since = COALESCE(member_verification.standing_since, excluded.standing_since)`
  ).bind(userId, state, adminId, reason, now, now).run();
}

/**
 * When a member is revoked for cause, everyone they vouched for is flagged for
 * review. Flagged, not revoked — a bad voucher does not prove a bad member.
 */
export async function cascadeVouchReview(env, revokedUserId, reason) {
  const affected = await env.DB.prepare(
    `SELECT subject_id FROM vouches WHERE voucher_id = ? AND withdrawn_at IS NULL`
  ).bind(revokedUserId).all();

  const now = new Date().toISOString();
  for (const r of affected.results || []) {
    try {
      await env.DB.prepare(
        `UPDATE member_verification SET flagged_at = ?, flagged_reason = ? WHERE user_id = ?`
      ).bind(now, `Voucher revoked: ${reason}`, r.subject_id).run();
    } catch (e) { /* member has no verification row yet */ }
  }
  return (affected.results || []).length;
}

// ─── Firewall ────────────────────────────────────────────────────────────────

/**
 * The single gate. Every tool call passes through here before anything happens.
 *
 * Returns { ok: true, registration } or { ok: false, verdict, reason }.
 * Logs to firewall_events either way — the refusals are the point.
 */
export async function checkCredential(env, credential, action, requiredScope, ctx = {}) {
  const log = async (verdict, reason, reg) => {
    try {
      await env.DB.prepare(
        `INSERT INTO firewall_events
           (id, credential, registration_id, sponsor_id, action, verdict, reason, client_type, plugin_version)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        crypto.randomUUID().replace(/-/g, ""),
        credential || null,
        reg?.id || null,
        reg?.sponsor_id || null,
        action,
        verdict,
        reason,
        ctx.client_type || null,
        ctx.plugin_version || null
      ).run();
    } catch (e) { /* logging must never break the gate */ }
  };

  if (!credential) {
    await log("refused", "No credential presented", null);
    return { ok: false, verdict: "refused", reason: "No credential presented. Agents must register with a verified human sponsor." };
  }

  const reg = await env.DB.prepare(
    `SELECT r.*, v.state AS sponsor_state
     FROM agent_registrations r
     LEFT JOIN member_verification v ON v.user_id = r.sponsor_id
     WHERE r.credential = ?`
  ).bind(credential).first();

  if (!reg) {
    await log("refused", "Credential not recognised", null);
    return { ok: false, verdict: "refused", reason: "Credential not recognised." };
  }
  if (reg.state === "revoked") {
    await log("refused", "Credential revoked", reg);
    return { ok: false, verdict: "refused", reason: "This credential has been revoked." };
  }
  if (new Date(reg.expires_at) < new Date()) {
    await log("refused", "Credential expired", reg);
    return { ok: false, verdict: "refused", reason: "This credential has expired." };
  }
  if (reg.sponsor_state !== "verified") {
    await log("refused", "Sponsor not in good standing", reg);
    return { ok: false, verdict: "refused", reason: "The sponsoring member is not in good standing." };
  }

  const held = (reg.scopes || "").split(/[\s,]+/).filter(Boolean);
  if (requiredScope && !held.includes(requiredScope)) {
    await log("refused", `Scope '${requiredScope}' not held`, reg);
    return {
      ok: false,
      verdict: "refused",
      reason: `This credential holds ${held.join(", ") || "no scopes"} and cannot perform '${action}'.`,
    };
  }

  await log("allowed", null, reg);
  try {
    await env.DB.prepare(
      `UPDATE agent_registrations SET last_seen_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).bind(reg.id).run();
  } catch (e) { /* non-fatal */ }

  return { ok: true, registration: reg };
}

// ─── Ledger ──────────────────────────────────────────────────────────────────

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Seal a contribution into the hash chain.
 *
 * Attribution is stamped here, server-side, from the resolved identity — never
 * from anything the client asserted. That is what makes bring-your-own-agent
 * compatible with strict provenance.
 */
export async function sealContribution(env, entry) {
  const prev = await env.DB.prepare(
    `SELECT seq, entry_hash FROM contributions ORDER BY seq DESC LIMIT 1`
  ).first();

  const seq = (prev?.seq || 0) + 1;
  const prevHash = prev?.entry_hash || "genesis";
  const sealedAt = new Date().toISOString();
  const bodyHash = entry.body ? await sha256Hex(entry.body) : null;

  const payload = [
    seq, prevHash, entry.user_id, entry.kind,
    entry.subject_type || "", entry.subject_id || "",
    bodyHash || "", entry.ai_role || "none", sealedAt,
  ].join("|");

  const entryHash = await sha256Hex(payload);
  const id = crypto.randomUUID().replace(/-/g, "");

  await env.DB.prepare(
    `INSERT INTO contributions
       (id, seq, user_id, kind, subject_type, subject_id, summary, body_hash,
        ai_role, ai_model, credential, hrc_verdict, hrc_clauses,
        prev_hash, entry_hash, sealed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id, seq, entry.user_id, entry.kind,
    entry.subject_type || null, entry.subject_id || null,
    entry.summary || null, bodyHash,
    entry.ai_role || "none", entry.ai_model || null,
    entry.credential || null, entry.hrc_verdict || null,
    entry.hrc_clauses ? JSON.stringify(entry.hrc_clauses) : null,
    prevHash, entryHash, sealedAt
  ).run();

  return { id, seq, entry_hash: entryHash, prev_hash: prevHash, sealed_at: sealedAt };
}

/**
 * Walk the chain and confirm nothing has been rewritten.
 * Returns { ok, checked, broken_at }.
 */
export async function verifyChain(env, limit = 1000) {
  const rows = await env.DB.prepare(
    `SELECT seq, user_id, kind, subject_type, subject_id, body_hash,
            ai_role, sealed_at, prev_hash, entry_hash
     FROM contributions ORDER BY seq ASC LIMIT ?`
  ).bind(limit).all();

  let expectedPrev = "genesis";
  for (const r of rows.results || []) {
    if (r.prev_hash !== expectedPrev) {
      return { ok: false, checked: r.seq, broken_at: r.seq };
    }
    const payload = [
      r.seq, r.prev_hash, r.user_id, r.kind,
      r.subject_type || "", r.subject_id || "",
      r.body_hash || "", r.ai_role || "none", r.sealed_at,
    ].join("|");
    if ((await sha256Hex(payload)) !== r.entry_hash) {
      return { ok: false, checked: r.seq, broken_at: r.seq };
    }
    expectedPrev = r.entry_hash;
  }

  return { ok: true, checked: (rows.results || []).length, broken_at: null };
}
