import { expect, test as setup } from "@playwright/test";

const HR_BASE_URL = "http://localhost:3003";

const TEST_USER = {
	email: "admin@test.local",
	password: "password123",
};

export const STORAGE_STATE_PATH = "e2e/.auth/user.json";

/**
 * Signs in through the HR app's own login form and saves the resulting storage state.
 *
 * Better Auth is cookie-based, so the session can't be assembled from tokens the way the
 * old Supabase setup did — driving the real form is both simpler and the thing under test.
 * The cookie is set on the api origin's domain (`localhost` in dev, shared across ports),
 * so `storageState` carries it into every project that depends on this setup.
 */
setup("authenticate", async ({ browser }) => {
	const context = await browser.newContext();
	const page = await context.newPage();

	await page.goto(`${HR_BASE_URL}/login`);
	await page.getByLabel("Email").fill(TEST_USER.email);
	await page.getByLabel("Password").fill(TEST_USER.password);
	await page.getByRole("button", { name: "Sign in" }).click();

	// The guard re-verifies claims on the next load, so landing off /login means the
	// session cookie is set and the claims resolved.
	await expect(page).not.toHaveURL(/\/login/);

	await context.storageState({ path: STORAGE_STATE_PATH });
	await context.close();
});
