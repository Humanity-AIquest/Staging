/**
 * /api/sign
 * POST — Add a signature to the Founding Memo. Body: { name, email, side, country }
 * Returns { success, number, count } where number = this signatory's position.
 */
import { json, jsonError, optionsResponse, newId } from "./_shared.js";
import { ensureMovementSchema } from "./_movement.js";
import { ensureConversationSchema, logInteraction } from "./_conversations.js";
import { sendTemplate } from "./_email.js";
import { createLead } from "./_zoho.js";

const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e || "");

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    await ensureMovementSchema(env);
    try { await env.DB.prepare("ALTER TABLE signatures ADD COLUMN newsletter INTEGER DEFAULT 0").run(); } catch (e) { /* exists */ }
    const { name, email, side, country, newsletter } = await request.json();

    if (!name || name.trim().length < 2) return jsonError("Please add your name.");
    if (!validEmail(email)) return jsonError("Please add a valid email.");

    const cleanSide = side === "developer" ? "developer" : "human";

    // One signature per email — return existing position if already signed.
    const existing = await env.DB.prepare(
      "SELECT id FROM signatures WHERE email = ?"
    ).bind(email.trim().toLowerCase()).first();

    if (!existing) {
      const cleanEmail = email.trim().toLowerCase();
      await env.DB.prepare(
        "INSERT INTO signatures (id, name, email, side, country, newsletter) VALUES (?,?,?,?,?,?)"
      ).bind(newId(), name.trim(), cleanEmail, cleanSide, country || null, newsletter ? 1 : 0).run();
      try {
        await ensureConversationSchema(env);
        await logInteraction(env, {
          kind: "signature", participant: cleanEmail,
          ref_type: "petition", ref_id: "founding-memo",
          summary: `${name.trim()} signed the petition (${cleanSide})`,
        });
      } catch (e) { /* index write is best-effort */ }
      // Best-effort thank-you email + CRM lead (no-op until env secrets are set).
      try { await sendTemplate(env, "signature_thanks", { to: cleanEmail, toName: name.trim(), vars: { name: name.trim() } }); } catch (e) { /* non-critical */ }
      try { await createLead(env, { firstName: name.trim(), lastName: name.trim(), email: cleanEmail, country, source: "Petition signature" }); } catch (e) { /* non-critical */ }
    }

    const count = (await env.DB.prepare("SELECT COUNT(*) AS n FROM signatures").first())?.n || 0;
    // Position = rowid order of this email
    const pos = await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM signatures WHERE created_at <= (SELECT created_at FROM signatures WHERE email = ?)"
    ).bind(email.trim().toLowerCase()).first();

    return json({ success: true, number: pos?.n || count, count });
  } catch (err) {
    return jsonError("Could not record your signature: " + err.message);
  }
}

export async function onRequestOptions() {
  return optionsResponse();
}
