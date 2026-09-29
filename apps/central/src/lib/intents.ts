import type { CommandName } from "@mcmec/domain";

/**
 * Names what a write means, at the call site.
 *
 *   employees.insert(row, intents("employees.addEmployee"))
 *
 * The collection layer takes `intents` as `string[]` and does not know the vocabulary. This is
 * where central binds it to the real command union, so a typo is a compile error rather than a
 * 400 at runtime. Moved from the retiring staff apps' `lib/db.ts` (#239); `import type`, so the
 * vocabulary is erased at build.
 */
export function intents(...names: CommandName[]) {
	return { metadata: { intents: names } };
}

/**
 * Carries a value that is not a column of the row being written.
 *
 *   spraySchedules.insert(row, withArguments(intents("website.createSprayMission"), {
 *     municipality_ids: ids,
 *   }))
 *
 * A collection handler only ever sees the row, so a payload field that lives in another table
 * has no way through. `arguments` is the channel #137 added for it: ./collections/command-write
 * flattens it into the envelope beside the changed fields, and the API skips it because it is
 * not a column. One command uses it: the one that writes two tables.
 */
export function withArguments(
	config: { metadata: { intents: CommandName[] } },
	args?: Record<string, unknown>,
) {
	return args ? { metadata: { ...config.metadata, arguments: args } } : config;
}
