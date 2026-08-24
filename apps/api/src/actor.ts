// Per-transaction audit-actor context.
//
// The append-only `log_mutation` trigger reads who/where from the `app.*` GUCs. Any write path
// that wants the audit row attributed to a user must run inside a transaction and call the
// returned setter first (see data.ts, users.ts). Shared so the GUC contract can't drift.

import { sql } from "drizzle-orm";
import type { Context } from "hono";
import type { db } from "./db";
import type { SessionInfo } from "./session";

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Postgres transaction id of the CURRENT transaction. MUST be queried inside the same
// tx as the write so it matches the txid Electric streams back (message.headers.txids) —
// the TanStack DB Electric collections return it to settle optimistic state (awaitTxId).
// xid8 -> text keeps the full 64-bit value; the client parses it with Number().
export async function getTxid(tx: Tx): Promise<string> {
	const res = await tx.execute(
		sql`select pg_current_xact_id()::xid8::text as txid`,
	);
	const rows = (res as unknown as { rows: Array<{ txid: string }> }).rows;
	return rows[0]?.txid ?? "";
}

// Returns a fn that stamps the per-transaction audit GUCs (is_local => rolled back with the tx).
export function setActor(session: SessionInfo, c: Context) {
	const ip =
		c.req.header("cf-connecting-ip") ?? c.req.header("x-forwarded-for") ?? "";
	const requestId = c.req.header("x-request-id") ?? "";
	return async (tx: Tx) => {
		await tx.execute(
			sql`select set_config('app.actor_user_id', ${session.userId}, true)`,
		);
		await tx.execute(
			sql`select set_config('app.actor_email', ${session.userEmail}, true)`,
		);
		await tx.execute(
			sql`select set_config('app.request_id', ${requestId}, true)`,
		);
		await tx.execute(sql`select set_config('app.ip_address', ${ip}, true)`);
	};
}

// Stamps the named domain command onto the audit rows the next write produces.
//
// Deliberately NOT folded into setActor's setter. The four actor GUCs are request-scoped — one
// user, one IP, one request id — but a single request can carry several commands (a save that
// both edits a notice and publishes it is two), and each audit row has to name the one that
// wrote it. So this is called per command, immediately before that command's writes, inside the
// same transaction; setting it once per request would mislabel every row after the first.
//
// Callers that set nothing (the pre-command write paths) log a null command rather than failing:
// log_mutation() reads the GUC with missing_ok.
export async function setCommand(tx: Tx, command: string) {
	await tx.execute(sql`select set_config('app.command', ${command}, true)`);
}
