/**
 * /api/quests/:id
 * GET — Quest detail with its Q&A thread.
 */
import { json, jsonError, optionsResponse } from "../_shared.js";
import { ensureMovementSchema, QUEST_SELECT, shapeQuest } from "../_movement.js";

export async function onRequestGet(context) {
  const { env, params } = context;
  try {
    await ensureMovementSchema(env);
    const row = await env.DB.prepare(
      `SELECT ${QUEST_SELECT}, q.problem FROM quests q WHERE q.id = ? AND q.status != 'Draft'`
    ).bind(params.id).first();
    if (!row) return jsonError("Quest not found.", 404);
    const quest = shapeQuest(row);

    const qa = await env.DB.prepare(
      `SELECT id, author, question, answer FROM quest_questions WHERE quest_id = ? ORDER BY created_at ASC`
    ).bind(params.id).all();

    return json({ quest: { ...quest, questions: qa.results || [] } });
  } catch (err) {
    return jsonError("Could not load quest: " + err.message);
  }
}

export async function onRequestOptions() {
  return optionsResponse();
}
