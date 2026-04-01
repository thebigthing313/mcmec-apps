import { test as setup } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? "http://127.0.0.1:54321";
const SUPABASE_ANON_KEY =
	process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

const HR_BASE_URL = "http://localhost:3003";

const TEST_USER = {
	email: "admin@test.local",
	password: "password123",
};

export const STORAGE_STATE_PATH = "e2e/.auth/user.json";

setup("authenticate", async ({ browser }) => {
	// Sign in via Supabase API to get session tokens
	const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
	const { data, error } = await supabase.auth.signInWithPassword({
		email: TEST_USER.email,
		password: TEST_USER.password,
	});

	if (error || !data.session) {
		throw new Error(`Auth setup failed: ${error?.message ?? "no session"}`);
	}

	const { access_token, refresh_token } = data.session;

	// Create a new context and navigate to the HR app origin to set localStorage.
	// Use a minimal page load — just need the origin for localStorage scoping.
	const context = await browser.newContext();
	const page = await context.newPage();

	// Navigate to the HR app origin — use a route that won't redirect
	// by going directly and immediately setting storage before any JS runs
	await page.goto(HR_BASE_URL, { waitUntil: "commit" });
	await page.evaluate(
		({ url, accessToken, refreshToken }) => {
			const storageKey = `sb-${new URL(url).hostname.split(".")[0]}-auth-token`;
			localStorage.setItem(
				storageKey,
				JSON.stringify({
					access_token: accessToken,
					refresh_token: refreshToken,
					token_type: "bearer",
				}),
			);
		},
		{
			url: SUPABASE_URL,
			accessToken: access_token,
			refreshToken: refresh_token,
		},
	);

	// Save the storage state (cookies + localStorage) for reuse
	await context.storageState({ path: STORAGE_STATE_PATH });
	await context.close();
});
