/**
 * Every table in the Postgres schema, as a type.
 *
 * A table name is spelled in four places that have no way to disagree politely: a collection's
 * `table`, a command module's `.table()` binding, `WRITABLE`'s keys and `shapes.ts`'s read
 * gate. All four were free strings, so `"meeting"` for `"meetings"` compiled everywhere and
 * failed at runtime — and once #174 derives a collection's write path from whether the
 * vocabulary names its table, a typo silently routes the collection back to the generic door.
 * That is the exact failure the documents slice shipped (#160), reached by a different road.
 *
 * Hand-written rather than derived from `apps/api/src/db/schema.ts`: deriving it would drag
 * `drizzle-orm` into this package, which #148 deliberately reduced to a pure Zod leaf so the
 * API could import it. The list changes only when a migration adds a table.
 */

export const TABLE_NAMES = [
	"accounts",
	"audit_log",
	"document_types",
	"documents",
	"employees",
	"insecticides",
	"job_postings",
	"meetings",
	"mosquito_activity_data",
	"municipalities",
	"notice_postings",
	"notice_types",
	"notices",
	"public_requests",
	"sessions",
	"spray_schedule_municipalities",
	"spray_schedules",
	"users",
	"verifications",
	"zip_codes",
] as const;

export type TableName = (typeof TABLE_NAMES)[number];
