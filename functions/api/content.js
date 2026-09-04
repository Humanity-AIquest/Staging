/**
 * GET /api/content?page=home&section=hero
 * Public endpoint — returns published site content for the frontend
 * No auth required
 */
import { json, jsonError, optionsResponse } from "./_shared.js";

export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const url = new URL(request.url);
    const pageKey = url.searchParams.get("page");
    const sectionKey = url.searchParams.get("section");

    if (!env.DB) {
      return jsonError("Content service unavailable.");
    }

    // Get specific section
    if (pageKey && sectionKey) {
      const content = await env.DB.prepare(
        "SELECT page_key, section_key, content_type, content, updated_at FROM site_content WHERE page_key = ? AND section_key = ?"
      ).bind(pageKey, sectionKey).first();

      return json({ content: content || null });
    }

    // Get all content for a page
    if (pageKey) {
      const result = await env.DB.prepare(
        "SELECT page_key, section_key, content_type, content, updated_at FROM site_content WHERE page_key = ? ORDER BY section_key"
      ).bind(pageKey).all();

      return json({ content: result.results || [] });
    }

    // Get all content (for full-site render)
    const result = await env.DB.prepare(
      "SELECT page_key, section_key, content_type, content, updated_at FROM site_content ORDER BY page_key, section_key"
    ).all();

    return json({ content: result.results || [] });
  } catch (err) {
    return jsonError("Failed to load content.");
  }
}

export async function onRequestOptions() { return optionsResponse(); }
