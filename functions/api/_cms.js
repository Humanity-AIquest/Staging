/**
 * CMS bootstrap — schema + one-time import of the archived live-site copy.
 *
 * Decision (Antony, 2026-10-01): the CMS is disconnected from the live site (its
 * content retired to an archive, see _cms_archive.js) and wired to the development
 * site. A fresh development database therefore starts from the archived copy, so
 * legacy pages keep the wording the founders last edited.
 *
 * Rules:
 *  - Runs once per database (marker row in app_meta) and once per isolate.
 *  - Never overwrites a row that is newer than the archive (newer-wins upsert).
 *  - Best-effort: callers swallow errors so a seeding problem never blocks content reads.
 */
import { newId } from "./_shared.js";
import { CMS_ARCHIVE_ID, CMS_ARCHIVE_ROWS } from "./_cms_archive.js";

let _ready = false;

export async function ensureContentSchema(env) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS site_content (
    id TEXT PRIMARY KEY,
    page_key TEXT NOT NULL,
    section_key TEXT NOT NULL,
    content_type TEXT DEFAULT 'text',
    content TEXT,
    updated_by TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(page_key, section_key)
  )`).run();

  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS site_content_history (
    id TEXT PRIMARY KEY,
    content_id TEXT NOT NULL,
    old_content TEXT,
    new_content TEXT,
    updated_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();
}

export async function seedCmsFromArchive(env) {
  if (_ready || !env || !env.DB) return;
  await ensureContentSchema(env);
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS app_meta (key TEXT PRIMARY KEY, value TEXT)").run();

  const marker = "cms_archive:" + CMS_ARCHIVE_ID;
  const done = await env.DB.prepare("SELECT value FROM app_meta WHERE key = ?").bind(marker).first();
  if (!done) {
    const upsert = `INSERT INTO site_content (id, page_key, section_key, content_type, content, updated_by, updated_at)
      VALUES (?,?,?,?,?,?,?)
      ON CONFLICT(page_key, section_key) DO UPDATE SET
        content = excluded.content, content_type = excluded.content_type,
        updated_by = excluded.updated_by, updated_at = excluded.updated_at
      WHERE excluded.updated_at > site_content.updated_at`;
    const stmts = CMS_ARCHIVE_ROWS.map((r) =>
      env.DB.prepare(upsert).bind(newId(), r.page_key, r.section_key, r.content_type || "text", r.content, "archive-import", r.updated_at));
    await env.DB.batch(stmts);
    await env.DB.prepare("INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)").bind(marker, new Date().toISOString()).run();
  }
  _ready = true;
}
