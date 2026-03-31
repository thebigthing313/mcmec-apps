import {
	type CentralCollections,
	createCentralCollections,
} from "@mcmec/supabase/collections/central";
import { queryClient, supabase } from "./queryClient";

// ---------------------------------------------------------------------------
// Db singleton
// ---------------------------------------------------------------------------

let instance: CentralCollections | null = null;

export function getDb(): CentralCollections {
	if (!instance) {
		instance = createCentralCollections({ supabase, queryClient });
	}
	return instance;
}

export function useDb(): CentralCollections {
	return getDb();
}

export type Db = CentralCollections;

// Re-export individual collections for direct import
const db = getDb();
export const { employees } = db;
