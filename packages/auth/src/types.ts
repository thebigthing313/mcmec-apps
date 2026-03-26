import type { SupabaseClient as SupabaseClientBase } from "@supabase/supabase-js";

export interface Claims {
	userId: string;
	userEmail: string;
	profileId: string | null;
	employeeId: string | null;
	permissions: string[];
}

export type SupabaseClient = SupabaseClientBase<any, any, any>;
