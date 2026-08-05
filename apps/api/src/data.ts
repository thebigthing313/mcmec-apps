// Generic write endpoints (replaces the old PostgREST crud.ts path).
//
//   POST   /api/data/:table       insert
//   PATCH  /api/data/:table/:id   update by id
//   DELETE /api/data/:table/:id   delete by id
//
// Each write runs in a transaction that first sets the `app.*` GUCs so the audit trigger
// (log_mutation) records who/where. Permissions mirror the old RLS write policies.

import { eq } from "drizzle-orm";
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
	return {
		permission,
		insertable,
		insert: async (body, tx) => {
			const data = insertSchema.parse(stripServerCols(body));
			// biome-ignore lint/suspicious/noExplicitAny: drizzle can't type a generic-table write
			const rows = await (tx.insert(table) as any).values(data).returning();
			return rows[0];
		},
		update: async (id, body, tx) => {
			const data = updateSchema.parse(stripServerCols(body));
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

const WRITABLE: Record<string, CrudEntry> = {
	// manage_website — public-website content
	notice_types: makeCrud(
		schema.noticeTypes,
		schema.noticeTypes.id,
		"manage_website",
	),
	notices: makeCrud(schema.notices, schema.notices.id, "manage_website"),
	meetings: makeCrud(schema.meetings, schema.meetings.id, "manage_website"),
	insecticides: makeCrud(
		schema.insecticides,
		schema.insecticides.id,
		"manage_website",
	),
	document_types: makeCrud(
		schema.documentTypes,
		schema.documentTypes.id,
		"manage_website",
	),
	documents: makeCrud(schema.documents, schema.documents.id, "manage_website"),
	municipalities: makeCrud(
		schema.municipalities,
		schema.municipalities.id,
		"manage_website",
	),
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
	job_postings: makeCrud(
		schema.jobPostings,
		schema.jobPostings.id,
		"manage_employees",
	),
};

// Resolve the target table + enforce session/permission. Returns a Response on failure.
async function guard(
	c: Context,
): Promise<{ entry: CrudEntry; session: SessionInfo } | Response> {
	const table = c.req.param("table");
	const entry = table ? WRITABLE[table] : undefined;
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
