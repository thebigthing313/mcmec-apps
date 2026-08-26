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
		if (
			hit.column.dataType === "date" &&
			typeof value === "string" &&
			value !== ""
		) {
			values[hit.property] = new Date(value);
			continue;
		}
		// A `numeric` column is `dataType: "string"` in Drizzle — the driver refuses to guess
		// how a float should round — while the wire carries it as a number, because that is
		// what Electric's parser hands the collection back (`rainfall_inches`). Postgres
		// applies the column's own scale, so the string need not be pre-rounded.
		if (hit.column.dataType === "string" && typeof value === "number") {
			values[hit.property] = String(value);
			continue;
		}
		values[hit.property] = value;
	}
	return values;
}
