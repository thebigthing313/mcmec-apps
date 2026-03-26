import { createClient } from "@supabase/supabase-js";

function getRequiredEnvVar(name: string): string {
	const value = process.env[name];
	if (!value) {
		throw new Error(
			`Environment variable ${name} must be set for integration tests.`,
		);
	}
	return value;
}

const SUPABASE_URL = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
const SUPABASE_ANON_KEY = getRequiredEnvVar("SUPABASE_ANON_KEY");

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Seed credentials (from supabase/seeds/001_seed.sql)
export const TEST_USER = {
	email: "admin@test.local",
	password: "password123",
};
