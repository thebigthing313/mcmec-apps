/**
 * The two things the public site and the api's shape proxy have to agree on to read a table.
 *
 * Copies, on purpose (#239): their twins are `shapePathFor` and `electricParser` in
 * `apps/central/src/lib/collections/electric-collection.ts`. A few lines are cheaper to keep
 * twice than a package is to keep once, and drift is loud — a 404 on every shape request, or
 * dates arriving as strings. `apps/central/src/lib/collections/shape-twins.test.ts` pins both
 * copies to the same answers.
 *
 * Imports nothing, so that test can take this file without the Electric client behind it.
 */

/** The shape proxy's path for a table; `apps/api` serves it at `/api/shapes/:table`. */
export function shapePathFor(table: string): string {
	return `/api/shapes/${table}`;
}

/**
 * Electric leaves these Postgres types as strings. Coerce them to match the `db/*` Zod schema
 * outputs (Date / number), so an SSR row and a staff app's synced row read the same.
 */
const toDate = (value: string) => new Date(value);
export const electricParser = {
	date: toDate,
	numeric: (value: string) => Number(value),
	timestamp: toDate,
	timestamptz: toDate,
};
