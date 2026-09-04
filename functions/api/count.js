/**
 * /api/count
 * GET — Live petition stats for the homepage + petition counter.
 * Returns { count, nations }.
 */
import { json, jsonError, optionsResponse } from "./_shared.js";
import { ensureMovementSchema } from "./_movement.js";

export async function onRequestGet(context) {
  const { env } = context;
  try {
    await ensureMovementSchema(env);
    const count = (await env.DB.prepare("SELECT COUNT(*) AS n FROM signatures").first())?.n || 0;
    const nations = (await env.DB.prepare(
      "SELECT COUNT(DISTINCT country) AS n FROM signatures WHERE country IS NOT NULL AND country <> ''"
    ).first())?.n || 0;
    return json({ count, nations });
  } catch (err) {
    return jsonError("Could not load count: " + err.message);
  }
}

export async function onRequestOptions() {
  return optionsResponse();
}
