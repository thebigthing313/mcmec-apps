/**
 * The row-scoped writes almost every handler is made of.
 *
 * #134 names 49 commands, and most of them are one `set` or one `delete` against one row
 * addressed by the envelope id. The first two slices each wrote that out by hand and arrived at
 * byte-identical code modulo the table; a third would have made it a convention by accident.
 *
 * This lives in `apps/api/src/commands/` deliberately, not in `@mcmec/domain`. #135 split the
 * two on define-versus-implement, and these take a Drizzle table and a transaction — they are
 * nothing BUT implementation. The line to hold is that nothing here may grow a precondition: a
 * rule about when a command may run is the command's own business (`archiveNotice` keeps
 * P.L. 2025 c.72), because a shared helper that quietly starts carrying policy is exactly how
 * the define/implement split erodes.
 */
import { eq } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import type { Tx } from "../actor";
import { CommandError } from "./types";

/** Every table these commands address is keyed by a single `id` column. */
type RowTable = PgTable & { id: PgColumn };

/**
 * The envelope named a row that is not there.
 *
 * One instance, shared: it carries no table name on purpose. A 404 that says which table it
 * looked in tells an unauthorised caller the row does not exist rather than that they may not
 * see it, and the client already knows what it asked for.
 */
export const NOT_FOUND = new CommandError(404, { error: "not found" });

/**
 * Sets columns on one row, refusing if it is not there.
 *
 * `returning` rather than a rowcount check because Drizzle's update result shape varies by
 * driver, and because a lifecycle handler that silently updated zero rows would report success
 * for a row someone else had just deleted.
 */
export async function setFields(
	tx: Tx,
	table: RowTable,
	id: string,
	values: Record<string, unknown>,
): Promise<void> {
	const rows = await tx
		.update(table)
		.set(values)
		.where(eq(table.id, id))
		.returning({ id: table.id });
	if (rows.length === 0) throw NOT_FOUND;
}

/**
 * Deletes one row, refusing if it is not there.
 *
 * Foreign keys are NOT handled here. #137 put the FK→409 mapping on the deleting handler,
 * because "still referenced" needs a sentence naming what still references it, and only the
 * handler knows. Wrap this call and use `isForeignKeyViolation`.
 */
export async function deleteRow(
	tx: Tx,
	table: RowTable,
	id: string,
): Promise<void> {
	const rows = await tx
		.delete(table)
		.where(eq(table.id, id))
		.returning({ id: table.id });
	if (rows.length === 0) throw NOT_FOUND;
}

/** Postgres `foreign_key_violation`. A fact about the driver, not a policy about the table. */
export function isForeignKeyViolation(e: unknown): boolean {
	return (
		typeof e === "object" &&
		e !== null &&
		"code" in e &&
		(e as { code?: string }).code === "23503"
	);
}
