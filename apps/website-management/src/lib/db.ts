import {
	createNoticesCollections,
	type NoticesCollections,
} from "@mcmec/supabase/collections/notices";
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
	meetings,
	mosquitoActivityData,
	municipalities,
	noticeTypes,
	notices,
	publicRequests,
	spraySchedules,
	zipCodes,
} = db;
