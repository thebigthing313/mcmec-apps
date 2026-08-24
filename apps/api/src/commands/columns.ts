/**
 * The one place snake_case payloads meet Drizzle.
 *
 * Replaces `crud.ts`'s client-side `toCamelCaseKeys` and `data.ts`'s `coerceDates`: both jobs
 * are table-driven off `getTableColumns`, because the column list is the fact and restating it
 * as `z.coerce.date()` in every payload schema would be a copy of it.
 *
 * `stripServerCols` has no successor — a payload schema that does not declare `created_at`
 * cannot carry it this far.
 */
import { getTableColumns } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";

export function toColumnValues(
	table: PgTable,
	payload: Record<string, unknown>,
): Record<string, unknown> {
	const columns = getTableColumns(table);
	const byDbName = new Map(
		Object.entries(columns).map(([property, column]) => [
			column.name,
			{ column, property },
		]),
	);

	const values: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(payload)) {
		const hit = byDbName.get(key);
		// A payload field that is not a column of this table is the handler's business
		// (`municipality_ids`), never a silent write.
		if (!hit) continue;
		// Columns drizzle hands back as a JS Date want a Date on the way in; a JSON body can
		// only carry an ISO string. Empty string is left alone so it fails as a string rather
		// than as an Invalid Date.
		values[hit.property] =
			hit.column.dataType === "date" &&
			typeof value === "string" &&
			value !== ""
				? new Date(value)
				: value;
	}
	return values;
}
