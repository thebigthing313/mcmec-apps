import {
	createNoticesCollections,
	type NoticesCollections,
} from "@mcmec/supabase/collections/notices";
import { queryClient, supabase } from "./queryClient";

// ---------------------------------------------------------------------------
// Db singleton
// ---------------------------------------------------------------------------

let instance: NoticesCollections | null = null;

export function getDb(): NoticesCollections {
	if (!instance) {
		instance = createNoticesCollections({ supabase, queryClient });
	}
	return instance;
}

export function useDb(): NoticesCollections {
	return getDb();
}

export type Db = NoticesCollections;

// Re-export individual collections for direct import
const db = getDb();
export const { employees, insecticides, meetings, noticeTypes, notices } = db;
