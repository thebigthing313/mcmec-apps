import {
	type AdminCollections,
	createAdminCollections,
} from "@mcmec/schemas/collections/admin";
import { API_URL } from "./queryClient";

// ---------------------------------------------------------------------------
// Db singleton
// ---------------------------------------------------------------------------

let instance: AdminCollections | null = null;

export function getDb(): AdminCollections {
	if (!instance) {
		instance = createAdminCollections({ apiUrl: API_URL });
	}
	return instance;
}

export function useDb(): AdminCollections {
	return getDb();
}

export type Db = AdminCollections;

// Re-export individual collections for direct import
const db = getDb();
export const { employees } = db;
