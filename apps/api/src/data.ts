// The generic write path — now serving nothing.
//
//   POST   /api/data/:table       insert
//   PATCH  /api/data/:table/:id   update by id
//   DELETE /api/data/:table/:id   delete by id
//
// `WRITABLE` is EMPTY as of #165. `employees` was the last table on it, so every write in every
// app now names a command and goes to `POST /api/commands`; every request that still reaches
// these three handlers gets the 404 `guard` has always returned for a table it does not hold.
//
// The map is kept — rather than the file deleted — because it is this cutover's progress bar
// (#150 Q5), and it reads zero. #140 deletes it along with `packages/sync/src/crud.ts`, which is
// then a diff about removing code nothing routes through.
//
// What went with the last entry: `makeCrud` and the two body-shapers it owned, `stripServerCols`
// and `coerceDates`. Both had successors before they had no callers — a payload schema that does
// not declare `created_at` cannot carry it, and `toColumnValues` coerces dates from the column
// list at the one place the API hands data to Drizzle (`commands/columns.ts`).

import { COMMANDED_TABLES, type TableName } from "@mcmec/domain";
import type { Context } from "hono";
import { ZodError } from "zod";
import { getTxid, setActor, type Tx } from "./actor";
import { db } from "./db";
import { pgErrorResponse } from "./db-errors";
import { getSessionInfo, type SessionInfo } from "./session";

type CrudEntry = {
	permission: string;
	insert: (body: unknown, tx: Tx) => Promise<unknown>;
	update: (id: string, body: unknown, tx: Tx) => Promise<unknown>;
	remove: (id: string, tx: Tx) => Promise<unknown>;
};

const WRITABLE: Partial<Record<TableName, CrudEntry>> = {};

// Boot-time assertion, the mirror of dispatch.ts's `permission: null` check.
//
// A table cut over in two places, and until #174 nothing tied them together: it left this map,
// and its collection gained `commands: true`. `packages/sync` now derives the second from the
// vocabulary, so that half cannot disagree; this is the other half. A table that had commands
// but kept its entry here kept a working generic door, and writes through it landed
// `audit_log.command = null` — the exact hole #144 built that column to close, and the quieter
// of the two failures because nothing breaks.
//
// Deliberately an assertion rather than a filter (#150 Q5): filtering would have left entries as
// dead code that nothing forced a slice to delete. The loop now runs over an empty map, which is
// the state it was written to reach.
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
