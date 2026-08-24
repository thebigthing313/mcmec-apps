import { defineConfig, devices } from "@playwright/test";

const STORAGE_STATE_PATH = "e2e/.auth/user.json";

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: "html",
	use: {
		trace: "on-first-retry",
	},
	projects: [
		{
			name: "setup",
			testMatch: /auth\.setup\.ts/,
		},
		{
			name: "public",
			use: {
				...devices["Desktop Chrome"],
				baseURL: "http://localhost:3007",
			},
			testMatch: /public\/.+\.spec\.ts/,
		},
		{
			name: "website-management",
			dependencies: ["setup"],
			use: {
				...devices["Desktop Chrome"],
				baseURL: "http://localhost:3006",
				storageState: STORAGE_STATE_PATH,
			},
			testMatch: /website-management\/.+\.spec\.ts/,
		},
	],
	webServer: [
		{
			command: "pnpm --filter central dev",
			port: 3001,
			reuseExistingServer: !process.env.CI,
			timeout: 120000,
		},
		{
			command: "pnpm --filter public dev",
			port: 3007,
			reuseExistingServer: !process.env.CI,
			timeout: 120000,
		},
		{
			command: "pnpm --filter website-management dev",
			port: 3006,
			reuseExistingServer: !process.env.CI,
			timeout: 120000,
		},
	],
});
