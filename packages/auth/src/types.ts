export interface Claims {
	userId: string;
	userEmail: string;
	employeeId: string | null;
	permissions: string[];
}

// biome-ignore lint/suspicious/noExplicitAny: accepts any SupabaseClient regardless of Database generic
export type SupabaseClient = { auth: any; from: any; [key: string]: any };
