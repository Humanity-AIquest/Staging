/**
 * /api/quests
 * GET  — Public list of quests (everything except Drafts), each with its campaign model:
 *        type (prize | startup | crowd), goal, raised, currency, deadline, backers, sponsor,
 *        pledges[], tranches[], is_demo and the live team count (registered pitches).
 * POST — Admin only (ACL editor+): create a quest.
 */
import { json, jsonError, optionsResponse, getUser, requireACL, newId } from "../_shared.js";
import { ensureMovementSchema, QUEST_SELECT, shapeQuest, cleanQuestInput, DEFAULT_TRANCHES } from "../_movement.js";

export async function onRequestGet(context) {
  const { env } = context;
  try {
    await ensureMovementSchema(env);
    const rows = await env.DB.prepare(
      `SELECT ${QUEST_SELECT} FROM quests q WHERE q.status != 'Draft' ORDER BY (q.status = 'Open') DESC, q.created_at DESC`
    ).all();
    const quests = (rows.results || []).map(shapeQuest);
    return json({ quests });
  } catch (err) {
    return jsonError("Could not load quests: " + err.message);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    await ensureMovementSchema(env);
    const user = await getUser(request, env);
    const denied = requireACL(user, 3); // editor+
    if (denied) return denied;

    const body = await request.json();
    const { id, title } = body;
    if (!title) return jsonError("A quest needs a title.");
    const slug = (id || title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

    const { fields, error } = cleanQuestInput({ ...body, title });
    if (error) return jsonError(error);
    const type = fields.type || "prize";
    if (!fields.tranches) fields.tranches = JSON.stringify(DEFAULT_TRANCHES[type]);
    const status = ["Draft", "Open"].includes(body.status) ? body.status : "Open";

    const cols = ["id", "status", ...Object.keys(fields)];
    await env.DB.prepare(
      `INSERT INTO quests (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(",")})`
    ).bind(slug, status, ...Object.values(fields)).run();

    return json({ success: true, id: slug });
  } catch (err) {
    return jsonError("Could not create quest: " + err.message);
  }
}

export async function onRequestOptions() {
  return optionsResponse();
}

function safeTags(t) {
  try { const a = JSON.parse(t); return Array.isArray(a) ? a : []; } catch { return []; }
}
