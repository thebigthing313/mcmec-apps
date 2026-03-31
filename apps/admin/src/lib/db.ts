import {
	type AdminCollections,
	createAdminCollections,
} from "@mcmec/supabase/collections/admin";
import { queryClient, supabase } from "./queryClient";

// ---------------------------------------------------------------------------
// Db singleton
// ---------------------------------------------------------------------------

let instance: AdminCollections | null = null;

export function getDb(): AdminCollections {
	if (!instance) {
		instance = createAdminCollections({ supabase, queryClient });
	}
	return instance;
}

export function useDb(): AdminCollections {
	return getDb();
}

export type Db = AdminCollections;

// Re-export individual collections for direct import
const db = getDb();
export const { employees, permissions, userPermissions } = db;
