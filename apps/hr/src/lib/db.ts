import type { CommandName } from "@mcmec/domain";
import {
	createHrCollections,
	type HrCollections,
} from "@mcmec/sync/collections/hr";
import { API_URL } from "./queryClient";

// ---------------------------------------------------------------------------
// Db singleton
// ---------------------------------------------------------------------------

let instance: HrCollections | null = null;

export function getDb(): HrCollections {
	if (!instance) {
		instance = createHrCollections({ apiUrl: API_URL });
	}
	return instance;
}

export function useDb(): HrCollections {
	return getDb();
}

export type Db = HrCollections;

// Re-export individual collections for direct import
const db = getDb();
export const { employees } = db;

// ---------------------------------------------------------------------------
// Command intents
// ---------------------------------------------------------------------------

/**
 * Names what a write means, at the call site.
 *
 *   employees.insert(row, intents("employees.addEmployee"))
 *
 * `packages/sync` deliberately does not know the vocabulary — `intents` is `string[]` there
 * (#135 Q1). This is the one place this app binds it to the real command union, so a typo is a
 * compile error rather than a 400 at runtime.
 *
 * Copied rather than shared with the other apps, deliberately (#165): four lines whose whole
 * job is to be an app's own binding point, and a shared one would be an import of the vocabulary
 * that every app pays for whether or not it names an intent. `toastOnError` and `useFormSeed`
 * went the other way and moved into `@mcmec/ui`, because neither knows a command name.
 */
export function intents(...names: CommandName[]) {
	return { metadata: { intents: names } };
}
