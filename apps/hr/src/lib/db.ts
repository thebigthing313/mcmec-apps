import {
	createHrCollections,
	type HrCollections,
} from "@mcmec/supabase/collections/hr";
import { queryClient, supabase } from "./queryClient";

// ---------------------------------------------------------------------------
// Db singleton
// ---------------------------------------------------------------------------

let instance: HrCollections | null = null;

export function getDb(): HrCollections {
	if (!instance) {
		instance = createHrCollections({ supabase, queryClient });
	}
	return instance;
}

export function useDb(): HrCollections {
	return getDb();
}

export type Db = HrCollections;

// Re-export individual collections for direct import
const db = getDb();
export const { employees, jobPostings } = db;
