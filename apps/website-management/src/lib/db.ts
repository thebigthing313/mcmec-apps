import type { CommandName } from "@mcmec/domain";
import {
	createNoticesCollections,
	type NoticesCollections,
} from "@mcmec/sync/collections/notices";
import { API_URL } from "./queryClient";

// ---------------------------------------------------------------------------
// Db singleton
// ---------------------------------------------------------------------------

let instance: NoticesCollections | null = null;

export function getDb(): NoticesCollections {
	if (!instance) {
		instance = createNoticesCollections({ apiUrl: API_URL });
	}
	return instance;
}

export function useDb(): NoticesCollections {
	return getDb();
}

export type Db = NoticesCollections;

// Re-export individual collections for direct import
const db = getDb();
export const {
	documentTypes,
	documents,
	employees,
	insecticides,
	jobPostings,
	meetings,
	mosquitoActivityData,
	municipalities,
	noticeTypes,
	notices,
	publicRequests,
	sprayScheduleMunicipalities,
	spraySchedules,
	zipCodes,
} = db;

// ---------------------------------------------------------------------------
// Command intents
// ---------------------------------------------------------------------------

/**
 * Names what a write means, at the call site.
 *
 *   notices.insert(value, intents("website.createNotice"))
 *
 * `packages/sync` deliberately does not know the vocabulary — `intents` is `string[]`
 * there (#135 Q1). This is the one place the app binds it to the real command union, so a typo
 * is a compile error rather than a 400 at runtime.
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
 * A collection handler only ever sees the row — `mutation.changes` for an update, the whole
 * row for an insert — so a payload field that lives in another table has no way through.
 * `arguments` is the channel #137 added for it; `packages/sync` flattens it into the envelope
 * beside the changed fields, and the API's `toColumnValues` skips it because it is not a column
 * of the table. One command uses it today, and it is the one command that writes two tables.
 */
export function withArguments(
	config: { metadata: { intents: CommandName[] } },
	args?: Record<string, unknown>,
) {
	return args ? { metadata: { ...config.metadata, arguments: args } } : config;
}
