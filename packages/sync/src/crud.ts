/**
 * Write helpers for TanStack DB Electric collection handlers.
 *
 * Reads come from Electric (see the collection factories); writes go through the
 * backend's generic data API — permission-gated + audit-logged:
 *   POST   /api/data/:table       insert
 *   PATCH  /api/data/:table/:id   update by id
 *   DELETE /api/data/:table/:id   delete by id
 *
 * Casing: Electric streams snake_case (the db/* Zod schemas are snake_case), but the
 * API validates with drizzle-zod whose keys are the Drizzle TS property names
 * (camelCase). So every write body is converted snake_case -> camelCase here — the
 * single place the two conventions meet.
 *
 * txid: each endpoint returns the Postgres `txid` of its write transaction. The Electric
 * collection handlers return it so optimistic state settles when that txid streams back
 * (see the collection factories). If the backend omits `txid`, the helpers return
 * `undefined` and the handler falls back to Electric's match timeout.
 */
import type z from "zod";
import type { ZodObject } from "zod";
import { dataPathFor } from "./routes";

const MAX_INSERT_ROWS = 500;

// ---------------------------------------------------------------------------
// snake_case -> camelCase (top-level keys only; jsonb values pass through intact)
// ---------------------------------------------------------------------------

export function snakeToCamel(key: string): string {
	return key.replace(/_([a-z0-9])/g, (_m, c: string) => c.toUpperCase());
}

export function toCamelCaseKeys(
	obj: Record<string, unknown>,
): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	for (const key of Object.keys(obj)) {
		out[snakeToCamel(key)] = obj[key];
	}
	return out;
}

// ---------------------------------------------------------------------------
// Shared fetch + response handling
// ---------------------------------------------------------------------------

export interface WriteTarget {
	/** API origin (VITE_API_URL) */
	apiUrl: string;
	/** table segment of /api/data/:table */
	table: string;
}

type WriteBody = { txid?: unknown; error?: unknown } | null;

// Parses the response: throws a descriptive Error on non-2xx, else returns the txid
// (as a number) when present.
async function handleWrite(
	res: Response,
	action: string,
	table: string,
): Promise<number | undefined> {
	const body = (await res.json().catch(() => null)) as WriteBody;
	if (!res.ok) {
		const detail =
			body && typeof body === "object" && "error" in body
				? body.error
				: res.statusText;
		throw new Error(
			`Failed to ${action} ${table} (${res.status}): ${String(detail)}`,
		);
	}
	const txid = body?.txid;
	if (txid == null) return undefined;
	const n = Number(txid);
	return Number.isFinite(n) ? n : undefined;
}

const jsonHeaders = { "content-type": "application/json" } as const;

// ---------------------------------------------------------------------------
// insert — POST one row at a time (the generic endpoint is single-row)
// ---------------------------------------------------------------------------

export async function apiInsertRows<
	TInsertSchema extends ZodObject<z.ZodRawShape>,
>(
	target: WriteTarget,
	insertSchema: TInsertSchema | undefined,
	rows: unknown[],
): Promise<number[]> {
	if (rows.length === 0) {
		throw new Error(`No rows provided for insert into ${target.table}`);
	}
	if (rows.length > MAX_INSERT_ROWS) {
		throw new Error(`Cannot insert more than ${MAX_INSERT_ROWS} rows at once`);
	}

	const txids: number[] = [];
	for (const row of rows) {
		const validated = insertSchema ? insertSchema.parse(row) : row;
		const body = toCamelCaseKeys(validated as Record<string, unknown>);
		const res = await fetch(`${target.apiUrl}${dataPathFor(target.table)}`, {
			method: "POST",
			credentials: "include",
			headers: jsonHeaders,
			body: JSON.stringify(body),
		});
		const txid = await handleWrite(res, "insert", target.table);
		if (txid !== undefined) txids.push(txid);
	}
	return txids;
}

// ---------------------------------------------------------------------------
// update — PATCH by id
// ---------------------------------------------------------------------------

export async function apiUpdateRow<
	TUpdateSchema extends ZodObject<z.ZodRawShape>,
>(
	target: WriteTarget,
	updateSchema: TUpdateSchema | undefined,
	id: string | number,
	changes: unknown,
): Promise<number | undefined> {
	const validated = updateSchema ? updateSchema.parse(changes) : changes;
	const body = toCamelCaseKeys(validated as Record<string, unknown>);
	const res = await fetch(`${target.apiUrl}${dataPathFor(target.table, id)}`, {
		method: "PATCH",
		credentials: "include",
		headers: jsonHeaders,
		body: JSON.stringify(body),
	});
	return handleWrite(res, "update", target.table);
}

// ---------------------------------------------------------------------------
// delete — DELETE by id
// ---------------------------------------------------------------------------

export async function apiDeleteRows(
	target: WriteTarget,
	ids: Array<string | number>,
): Promise<number[]> {
	const txids: number[] = [];
	for (const id of ids) {
		const res = await fetch(
			`${target.apiUrl}${dataPathFor(target.table, id)}`,
			{
				method: "DELETE",
				credentials: "include",
			},
		);
		const txid = await handleWrite(res, "delete", target.table);
		if (txid !== undefined) txids.push(txid);
	}
	return txids;
}
