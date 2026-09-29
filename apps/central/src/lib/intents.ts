import type { CommandName } from "@mcmec/domain";

/**
 * Names what a write means, at the call site.
 *
 *   employees.insert(row, intents("employees.addEmployee"))
 *
 * The collection layer takes `intents` as `string[]` and does not know the vocabulary. This is
 * where central binds it to the real command union, so a typo is a compile error rather than a
 * 400 at runtime. Moved from the retiring `hr` and `admin` apps' `lib/db.ts` (#239); `import type`,
 * so the vocabulary is erased at build.
 */
export function intents(...names: CommandName[]) {
	return { metadata: { intents: names } };
}
