/**
 * The one command route (#137), which `apps/api` serves and central posts to.
 *
 * A constant, not a function of table: a globally-unique dotted command name already fixes the
 * table, the operation and the permission, so there is nothing left for the path to carry.
 *
 * Moved here from the sync package when it was removed (#251, decision #239). It sits in its
 * own module, exported as `@mcmec/domain/routes`, and imports NOTHING: a consumer that wants the
 * path does not pay for the vocabulary and Zod behind the package root. Keep it that way.
 */
export const COMMAND_PATH = "/api/commands";
