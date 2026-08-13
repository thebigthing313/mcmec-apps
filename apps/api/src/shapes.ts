// Electric shape auth-proxy.
//
// Electric's HTTP API is private (no public domain). Browsers hit THIS endpoint instead; we
// validate the Better Auth session, set the shape's `table`/`where`/`columns` SERVER-SIDE
// (authorization — the client can never widen it), append ELECTRIC_SECRET, and reverse-proxy
// to Electric. Read rules mirror the old Postgres RLS SELECT policies.

import type { Context } from "hono";
import { getSessionInfo, type SessionInfo } from "./session";

// Server-injected shape params, or null to DENY the request.
type PolicyResult = { where?: string; columns?: string[] } | null;
type ShapePolicy = (session: SessionInfo | null) => PolicyResult;

// ── policies ─────────────────────────────────────────────────────────────────
const publicAll: ShapePolicy = () => ({});
const authenticated: ShapePolicy = (s) => (s ? {} : null);
const withPermission =
	(perm: string): ShapePolicy =>
	(s) =>
		s?.permissions.includes(perm) ? {} : null;

// Holders of `perm` (or any session when perm is null) see everything; everyone else is
// restricted to `publishedWhere`.
const publishedUnless =
	(perm: string | null, publishedWhere: string): ShapePolicy =>
	(s) => {
		const full = perm ? Boolean(s?.permissions.includes(perm)) : Boolean(s);
		return full ? {} : { where: publishedWhere };
	};

// table -> read policy (mirrors the old RLS SELECT rules)
const POLICIES: Record<string, ShapePolicy> = {
	// fully public lookups + content
	notice_types: publicAll,
	document_types: publicAll,
	insecticides: publicAll,
	meetings: publicAll,
	municipalities: publicAll,
	spray_schedules: publicAll,
	spray_schedule_municipalities: publicAll,
	mosquito_activity_data: publicAll,
	zip_codes: publicAll,
	// published-only for the public; full for any authenticated employee.
	// TODO: confirm the notices published filter (date/is_archived) during Electric wiring;
	// time-varying predicates (notice_date <= current_date) don't auto-update an Electric shape,
	// so is_published is the durable gate for now.
	notices: publishedUnless(null, "is_published = true"),
	documents: publishedUnless(null, "is_published = true"),
	// published + open for everyone; full listing only for HR
	job_postings: publishedUnless(
		"manage_employees",
		"published_at is not null and is_closed = false",
	),
	// staff-only
	employees: authenticated,
	public_requests: withPermission("manage_website"),
	notice_postings: withPermission("manage_website"),
};

// Client may pass only these (sync cursor state + log mode — can't widen access).
const SAFE_PARAMS = [
	"offset",
	"handle",
	"live",
	"cursor",
	"replica",
	"log",
] as const;

// On-demand collections additionally send `subset__where` / `subset__order_by` /
// `subset__params` to pull slices instead of the whole table. Forwarding them is safe:
// Electric intersects a subset with the shape's own `where` rather than replacing it, so a
// client cannot reach rows the policy excludes. Verified against staging — a shape pinned to
// `status = 'resolved'` returned 0 rows for `subset__where: status = 'new'` even though such
// a row exists, and `subset__where: true = true` still returned only the resolved set.
//
// Without these the collection doesn't fail loudly, it just syncs nothing (a 178-row table
// renders as "0 of 0"), so don't narrow this back without re-checking the on-demand screens.
//
// UPCOMING: Electric is moving shape fetching from GET to POST so subset predicates aren't
// bound by URL length limits. When the client starts sending POST, this proxy needs to:
//   - accept POST on the route (it's GET-only today, see app.ts),
//   - sanitize the request BODY instead of the query string — strip any client-supplied
//     `table`/`where`/`columns`/`secret` and inject the policy's server-side, since the
//     allowlist below only guards the URL,
//   - revisit the cache headers: the `Vary: Cookie` handling below assumes cacheable GETs.
// The security property itself still holds either way — Electric intersects the subset with
// the shape's `where` regardless of how the request is framed.
const SAFE_PARAM_PREFIX = "subset__";

export async function shapeProxy(c: Context): Promise<Response> {
	const table = c.req.param("table");
	const policy = table ? POLICIES[table] : undefined;
	if (!table || !policy) {
		return c.json({ error: `unknown shape: ${table}` }, 404);
	}

	const session = await getSessionInfo(c.req.raw.headers);
	const resolved = policy(session);
	if (!resolved) return c.json({ error: "forbidden" }, session ? 403 : 401);

	const electricUrl = process.env.ELECTRIC_URL;
	const electricSecret = process.env.ELECTRIC_SECRET;
	if (!electricUrl || !electricSecret) {
		return c.json({ error: "electric not configured" }, 500);
	}

	const origin = new URL("/v1/shape", electricUrl);
	// server-controlled shape definition
	origin.searchParams.set("table", table);
	if (resolved.where) origin.searchParams.set("where", resolved.where);
	if (resolved.columns?.length) {
		origin.searchParams.set("columns", resolved.columns.join(","));
	}
	origin.searchParams.set("secret", electricSecret);
	// client-controlled sync params only
	const incoming = new URL(c.req.url);
	for (const p of SAFE_PARAMS) {
		const v = incoming.searchParams.get(p);
		if (v !== null) origin.searchParams.set(p, v);
	}
	for (const [k, v] of incoming.searchParams) {
		if (k.startsWith(SAFE_PARAM_PREFIX)) origin.searchParams.set(k, v);
	}

	const electricRes = await fetch(origin, { method: "GET" });

	// Stream Electric's response back. Drop encoding/length (undici already decoded the body),
	// and Vary on Cookie so caches never mix authenticated and anonymous shapes.
	const headers = new Headers(electricRes.headers);
	headers.delete("content-encoding");
	headers.delete("content-length");
	headers.set("vary", "cookie");

	return new Response(electricRes.body, {
		status: electricRes.status,
		headers,
	});
}
