// Generic write endpoints (replaces the old PostgREST crud.ts path).
//
//   POST   /api/data/:table       insert
//   PATCH  /api/data/:table/:id   update by id
//   DELETE /api/data/:table/:id   delete by id
//
// Each write runs in a transaction that first sets the `app.*` GUCs so the audit trigger
// (log_mutation) records who/where. Permissions mirror the old RLS write policies.

import { COMMANDED_TABLES, type TableName } from "@mcmec/domain";
import { eq, getTableColumns } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import type { Context } from "hono";
import { ZodError } from "zod";
import { getTxid, setActor, type Tx } from "./actor";
import { db } from "./db";
import * as schema from "./db/schema";
import { pgErrorResponse } from "./db-errors";
import { getSessionInfo, type SessionInfo } from "./session";

// Server-controlled columns clients may never set on a generic write: id + audit timestamps
// (DB defaults own id/created_at; the set_updated_at trigger owns updated_at). Stripped from the
// body pre-parse rather than via schema .omit() (which can't type against a generic table shape).
const SERVER_COLS = ["id", "createdAt", "updatedAt"] as const;

function stripServerCols(body: unknown): unknown {
	if (!body || typeof body !== "object" || Array.isArray(body)) return body;
	const clone: Record<string, unknown> = {
		...(body as Record<string, unknown>),
	};
	for (const k of SERVER_COLS) delete clone[k];
	return clone;
}

// Columns drizzle hands back as a JS `Date` — every `timestamp` column, plus any `date` column
// declared in `date` mode. drizzle-zod turns those into `z.date()`, which a JSON body can never
// satisfy: the client can only send an ISO string. So coerce it back before parsing.
//
// Without this, EVERY write to a table carrying a timestamp column 422s with
// "expected date, received string" — found in the browser creating a meeting (`meetingAt` is
// notNull, so meetings were entirely unwritable). `job_postings.published_at` had the same hole.
// Columns in `string` mode (notices.notice_date, spray_schedules.mission_date) report dataType
// "string" and are correctly left alone.
function dateColumns(table: PgTable): string[] {
	return Object.entries(getTableColumns(table))
		.filter(([, col]) => col.dataType === "date")
		.map(([key]) => key);
}

function coerceDates(body: unknown, keys: string[]): unknown {
	if (!body || typeof body !== "object" || Array.isArray(body)) return body;
	const clone: Record<string, unknown> = {
		...(body as Record<string, unknown>),
	};
	for (const key of keys) {
		const value = clone[key];
		// Empty string is left as-is so it fails as a string rather than as an Invalid Date.
		if (typeof value === "string" && value !== "") clone[key] = new Date(value);
	}
	return clone;
}

type CrudEntry = {
	permission: string;
	insertable: boolean;
	insert: (body: unknown, tx: Tx) => Promise<unknown>;
	update: (id: string, body: unknown, tx: Tx) => Promise<unknown>;
	remove: (id: string, tx: Tx) => Promise<unknown>;
};

function makeCrud<T extends PgTable>(
	table: T,
	idCol: PgColumn,
	permission: string,
	insertable = true,
): CrudEntry {
	const insertSchema = createInsertSchema(table);
	const updateSchema = createUpdateSchema(table);
	const dates = dateColumns(table);
	return {
		permission,
		insertable,
		insert: async (body, tx) => {
			const data = insertSchema.parse(
				coerceDates(stripServerCols(body), dates),
			);
			// biome-ignore lint/suspicious/noExplicitAny: drizzle can't type a generic-table write
			const rows = await (tx.insert(table) as any).values(data).returning();
			return rows[0];
		},
		update: async (id, body, tx) => {
			const data = updateSchema.parse(
				coerceDates(stripServerCols(body), dates),
			);
			// biome-ignore lint/suspicious/noExplicitAny: drizzle can't type a generic-table write
			const rows = await (tx.update(table) as any)
				.set(data)
				.where(eq(idCol, id))
				.returning();
			return rows[0];
		},
		remove: async (id, tx) => {
			// biome-ignore lint/suspicious/noExplicitAny: drizzle can't type a generic-table write
			const rows = await (tx.delete(table) as any)
				.where(eq(idCol, id))
				.returning();
			return rows[0];
		},
	};
}

// Shrinking, one slice at a time. A table leaves this map as its named commands land (#150),
// so a cut-over table keeps no generic door whose writes would log `audit_log.command = null`.
// `municipalities` left without commands (#159): nothing writes it from any app, and municipality
// management belongs to the `reference` domain, which ships no commands until that screen exists.
// Keyed by `TableName` rather than `string`, so a typo here cannot quietly create a door onto
// a table that does not exist — the same reason the collections and the command modules take
// the union (#174).
const WRITABLE: Partial<Record<TableName, CrudEntry>> = {
	// manage_website — public-website content
	spray_schedules: makeCrud(
		schema.spraySchedules,
		schema.spraySchedules.id,
		"manage_website",
	),
	mosquito_activity_data: makeCrud(
		schema.mosquitoActivityData,
		schema.mosquitoActivityData.id,
		"manage_website",
	),
	// staff triage of intake — insert is public via /api/requests
	public_requests: makeCrud(
		schema.publicRequests,
		schema.publicRequests.id,
		"manage_website",
		false,
	),
	// manage_employees — HR
	employees: makeCrud(
		schema.employees,
		schema.employees.id,
		"manage_employees",
	),
};

// Boot-time assertion, the mirror of dispatch.ts's `permission: null` check.
//
// A table cuts over in two places, and until #174 nothing tied them together: it leaves this
// map, and its collection gains `commands: true`. `packages/sync` now derives the second from
// the vocabulary, so that half cannot disagree; this is the other half. A table that has
// commands but keeps its entry here keeps a working generic door, and writes through it land
// `audit_log.command = null` — the exact hole #144 built that column to close, and the quieter
// of the two failures because nothing breaks.
//
// Deliberately an assertion rather than a filter (#150 Q5): filtering would leave the entry as
// dead code that nothing forces a slice to delete, and `WRITABLE` shrinking to empty is this
// cutover's progress bar. The slice deletes its own entry, in its own diff.
for (const table of Object.keys(WRITABLE)) {
	if (COMMANDED_TABLES.has(table as TableName)) {
		throw new Error(
			`${table} has named commands but is still in WRITABLE — its generic door would log audit_log.command = null`,
		);
	}
}

// Resolve the target table + enforce session/permission. Returns a Response on failure.
async function guard(
	c: Context,
): Promise<{ entry: CrudEntry; session: SessionInfo } | Response> {
	const table = c.req.param("table");
	const entry = table ? WRITABLE[table as TableName] : undefined;
	if (!table || !entry) return c.json({ error: `not writable: ${table}` }, 404);
	const session = await getSessionInfo(c.req.raw.headers);
	if (!session) return c.json({ error: "unauthenticated" }, 401);
	if (!session.permissions.includes(entry.permission)) {
		return c.json({ error: "forbidden" }, 403);
	}
	return { entry, session };
}

export async function insertRow(c: Context): Promise<Response> {
	const g = await guard(c);
	if (g instanceof Response) return g;
	const { entry, session } = g;
	if (!entry.insertable) {
		return c.json({ error: "insert not allowed on this resource" }, 405);
	}
	const body = await c.req.json().catch(() => null);
	try {
		const actor = setActor(session, c);
		const { row, txid } = await db.transaction(async (tx) => {
			await actor(tx);
			const r = await entry.insert(body, tx);
			return { row: r, txid: await getTxid(tx) };
		});
		return c.json({ ...(row as Record<string, unknown>), txid }, 201);
	} catch (e) {
		if (e instanceof ZodError)
			return c.json({ error: "invalid", issues: e.issues }, 422);
		// bad FK / duplicate on a write = client error, not 500
		return pgErrorResponse(c, e, 422) ?? rethrow(e);
	}
}

export async function updateRow(c: Context): Promise<Response> {
	const g = await guard(c);
	if (g instanceof Response) return g;
	const { entry, session } = g;
	const id = c.req.param("id");
	if (!id) return c.json({ error: "missing id" }, 400);
	const body = await c.req.json().catch(() => null);
	try {
		const actor = setActor(session, c);
		const { row, txid } = await db.transaction(async (tx) => {
			await actor(tx);
			const r = await entry.update(id, body, tx);
			return { row: r, txid: await getTxid(tx) };
		});
		if (!row) return c.json({ error: "not found" }, 404);
		return c.json({ ...(row as Record<string, unknown>), txid });
	} catch (e) {
		if (e instanceof ZodError)
			return c.json({ error: "invalid", issues: e.issues }, 422);
		return pgErrorResponse(c, e, 422) ?? rethrow(e);
	}
}

export async function deleteRow(c: Context): Promise<Response> {
	const g = await guard(c);
	if (g instanceof Response) return g;
	const { entry, session } = g;
	const id = c.req.param("id");
	if (!id) return c.json({ error: "missing id" }, 400);
	try {
		const actor = setActor(session, c);
		const { row, txid } = await db.transaction(async (tx) => {
			await actor(tx);
			const r = await entry.remove(id, tx);
			return { row: r, txid: await getTxid(tx) };
		});
		if (!row) return c.json({ error: "not found" }, 404);
		return c.json({ ok: true, txid });
	} catch (e) {
		// FK violation here = the row is still referenced elsewhere (409, not 500)
		return pgErrorResponse(c, e, 409) ?? rethrow(e);
	}
}

// Helper so `pgErrorResponse(...) ?? rethrow(e)` stays a single expression.
function rethrow(e: unknown): never {
	throw e;
}
