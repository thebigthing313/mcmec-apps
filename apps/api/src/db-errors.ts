// Maps well-known Postgres error codes to clean HTTP responses so DB constraint violations
// don't surface as opaque 500s. Returns null for anything unrecognized (let the caller rethrow).
//
// `fkStatus` distinguishes the two meanings of a foreign-key violation: an insert/update that
// references a nonexistent row is bad input (422), whereas a delete blocked because the row is
// still referenced is a conflict (409).

import type { Context } from "hono";

function pgCode(e: unknown): string | undefined {
	return typeof e === "object" && e !== null && "code" in e
		? (e as { code?: string }).code
		: undefined;
}

export function pgErrorResponse(
	c: Context,
	e: unknown,
	fkStatus: 409 | 422 = 409,
): Response | null {
	switch (pgCode(e)) {
		case "23505": // unique_violation
			return c.json({ error: "conflict: value already exists" }, 409);
		case "23503": // foreign_key_violation
			return c.json(
				{
					error:
						fkStatus === 422
							? "invalid: unknown referenced record"
							: "conflict: record is still referenced",
				},
				fkStatus,
			);
		case "23514": // check_violation
			return c.json({ error: "invalid: violates a constraint" }, 422);
		case "22003": // numeric_value_out_of_range
			return c.json({ error: "invalid: numeric value out of range" }, 422);
		default:
			return null;
	}
}
