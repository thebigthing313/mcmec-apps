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

// Client may pass only these (sync cursor state — can't widen access).
const SAFE_PARAMS = ["offset", "handle", "live", "cursor", "replica"] as const;

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
