/**
 * Every URL the client and the API agree on, derived in exactly one place.
 *
 * This module imports NOTHING, deliberately. It is exposed as its own export
 * (`@mcmec/sync/routes`) so the Hono server can import the paths it serves without dragging
 * TanStack DB, Electric or Zod into the API bundle (#135 Q7) — a package-level guarantee that
 * only holds while the file stays dependency-free.
 */

/**
 * The one command route (#137).
 *
 * A constant, not a function of table: a globally-unique dotted command name already fixes the
 * table, the operation and the permission, so there is nothing left for the path to carry.
 */
export const COMMAND_PATH = "/api/commands";

/** The ElectricSQL shape proxy — reads, server-narrowed and permission-gated. */
export function shapePathFor(table: string): string {
	return `/api/shapes/${table}`;
}
