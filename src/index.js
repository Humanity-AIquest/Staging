/**
 * Worker entry point for the "staging" Worker.
 *
 * This project is a plain Cloudflare Worker (not a Pages project), so unlike
 * classic Cloudflare Pages there is no automatic routing from functions/api/*.js
 * files to /api/* paths. This router reimplements that file-based routing by
 * hand, dispatching to the same unmodified handler modules under functions/,
 * then falls back to serving the static SPA build via the ASSETS binding.
 */
import * as content from "../functions/api/content.js";
import * as count from "../functions/api/count.js";
import * as chat from "../functions/api/chat.js";
import * as sign from "../functions/api/sign.js";
import * as ideas from "../functions/api/ideas.js";

import * as authLogin from "../functions/api/auth/login.js";
import * as authLogout from "../functions/api/auth/logout.js";
import * as authMe from "../functions/api/auth/me.js";
import * as authSignup from "../functions/api/auth/signup.js";

import * as adminAudit from "../functions/api/admin/audit.js";
import * as adminComments from "../functions/api/admin/comments.js";
import * as adminContent from "../functions/api/admin/content.js";
import * as adminConversations from "../functions/api/admin/conversations.js";
import * as adminEvents from "../functions/api/admin/events.js";
import * as adminIdeas from "../functions/api/admin/ideas.js";
import * as adminMembers from "../functions/api/admin/members.js";
import * as adminNotes from "../functions/api/admin/notes.js";
import * as adminQuests from "../functions/api/admin/quests.js";
import * as adminSegments from "../functions/api/admin/segments.js";
import * as adminSignatures from "../functions/api/admin/signatures.js";
import * as adminSurveys from "../functions/api/admin/surveys.js";
import * as adminUsers from "../functions/api/admin/users.js";

import * as eventsIndex from "../functions/api/events/index.js";
import * as eventsRsvp from "../functions/api/events/[id]/rsvp.js";

import * as questsIndex from "../functions/api/quests/index.js";
import * as questsId from "../functions/api/quests/[id].js";
import * as questsPitch from "../functions/api/quests/[id]/pitch.js";
import * as questsQuestions from "../functions/api/quests/[id]/questions.js";

import * as surveysIndex from "../functions/api/surveys/index.js";
import * as surveysId from "../functions/api/surveys/[id].js";
import * as surveysResults from "../functions/api/surveys/[id]/results.js";
import * as surveysStatements from "../functions/api/surveys/[id]/statements.js";
import * as surveysVote from "../functions/api/surveys/[id]/vote.js";

// Static (exact-match) routes: pathname -> handler module
const STATIC_ROUTES = {
  "/api/content": content,
  "/api/count": count,
  "/api/chat": chat,
  "/api/sign": sign,
  "/api/ideas": ideas,
  "/api/auth/login": authLogin,
  "/api/auth/logout": authLogout,
  "/api/auth/me": authMe,
  "/api/auth/signup": authSignup,
  "/api/admin/audit": adminAudit,
  "/api/admin/comments": adminComments,
  "/api/admin/content": adminContent,
  "/api/admin/conversations": adminConversations,
  "/api/admin/events": adminEvents,
  "/api/admin/ideas": adminIdeas,
  "/api/admin/members": adminMembers,
  "/api/admin/notes": adminNotes,
  "/api/admin/quests": adminQuests,
  "/api/admin/segments": adminSegments,
  "/api/admin/signatures": adminSignatures,
  "/api/admin/surveys": adminSurveys,
  "/api/admin/users": adminUsers,
  "/api/events": eventsIndex,
  "/api/quests": questsIndex,
  "/api/surveys": surveysIndex,
};

// Dynamic routes: segment pattern (":id" = wildcard) -> handler module
const DYNAMIC_ROUTES = [
  { segments: ["api", "events", ":id", "rsvp"], module: eventsRsvp },
  { segments: ["api", "quests", ":id", "pitch"], module: questsPitch },
  { segments: ["api", "quests", ":id", "questions"], module: questsQuestions },
  { segments: ["api", "quests", ":id"], module: questsId },
  { segments: ["api", "surveys", ":id", "results"], module: surveysResults },
  { segments: ["api", "surveys", ":id", "statements"], module: surveysStatements },
  { segments: ["api", "surveys", ":id", "vote"], module: surveysVote },
  { segments: ["api", "surveys", ":id"], module: surveysId },
];

function matchDynamicRoute(pathname) {
  const parts = pathname.split("/").filter(Boolean);
  for (const route of DYNAMIC_ROUTES) {
    if (route.segments.length !== parts.length) continue;
    const params = {};
    let matched = true;
    for (let i = 0; i < parts.length; i++) {
      const seg = route.segments[i];
      if (seg.startsWith(":")) {
        params[seg.slice(1)] = decodeURIComponent(parts[i]);
      } else if (seg !== parts[i]) {
        matched = false;
        break;
      }
    }
    if (matched) return { module: route.module, params };
  }
  return null;
}

const METHOD_HANDLERS = {
  GET: "onRequestGet",
  POST: "onRequestPost",
  PUT: "onRequestPut",
  DELETE: "onRequestDelete",
  PATCH: "onRequestPatch",
  OPTIONS: "onRequestOptions",
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      let mod = STATIC_ROUTES[url.pathname];
      let params = {};

      if (!mod) {
        const dynamic = matchDynamicRoute(url.pathname);
        if (dynamic) {
          mod = dynamic.module;
          params = dynamic.params;
        }
      }

      if (!mod) {
        return new Response(JSON.stringify({ error: "Not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      const handlerName = METHOD_HANDLERS[request.method];
      const handler = handlerName && mod[handlerName];

      if (!handler) {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
          status: 405,
          headers: { "Content-Type": "application/json" },
        });
      }

      return handler({
        request,
        env,
        params,
        waitUntil: (p) => ctx.waitUntil(p),
      });
    }

    // Not an API route: serve the static SPA build, with SPA fallback
    // handled by the assets binding's not_found_handling config.
    return env.ASSETS.fetch(request);
  },
};
