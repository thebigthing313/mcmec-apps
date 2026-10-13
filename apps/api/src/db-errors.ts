// Maps well-known Postgres error codes to clean HTTP responses so DB constraint violations
// don't surface as opaque 500s. Returns null for anything unrecognized (let the caller rethrow).
//
// `fkStatus` distinguishes the two meanings of a foreign-key violation: an insert/update that
// references a nonexistent row is bad input (422), whereas a delete blocked because the row is
// still referenced is a conflict (409).

import type { Context } from "hono";

/**
 * The Postgres error itself, wherever the driver stack put it.
 *
 * Drizzle wraps every failed query in a `DrizzleQueryError` whose `cause` is the `pg` error, so
 * the code is one level down. Reading only the top level matched nothing, and every constraint
 * violation surfaced as a 500.
 */
function findPgError(
	e: unknown,
): { code: string; constraint?: string } | undefined {
	for (let at = e, depth = 0; depth < 3; depth++) {
		if (typeof at !== "object" || at === null) return undefined;
		const { code, cause } = at as { code?: unknown; cause?: unknown };
		if (typeof code === "string") {
			return at as { code: string; constraint?: string };
		}
		at = cause;
	}
	return undefined;
}

/** The SQLSTATE of a Postgres error — `23505` for a unique violation. */
export function pgErrorCode(e: unknown): string | undefined {
	return findPgError(e)?.code;
}

/** The constraint a violation names, so a handler can tell one unique key from another. */
export function pgErrorConstraint(e: unknown): string | undefined {
	return findPgError(e)?.constraint;
}

export function pgErrorResponse(
	c: Context,
	e: unknown,
	fkStatus: 409 | 422 = 409,
): Response | null {
	switch (pgErrorCode(e)) {
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
