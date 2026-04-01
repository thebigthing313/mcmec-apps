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
				baseURL: "http://localhost:3000",
			},
			testMatch: /public\/.+\.spec\.ts/,
		},
		{
			name: "hr",
			dependencies: ["setup"],
			use: {
				...devices["Desktop Chrome"],
				baseURL: "http://localhost:3003",
				storageState: STORAGE_STATE_PATH,
			},
			testMatch: /hr\/.+\.spec\.ts/,
		},
	],
	webServer: [
		{
			command: "pnpm --filter public dev",
			port: 3000,
			reuseExistingServer: !process.env.CI,
		},
		{
			command: "pnpm --filter hr dev",
			port: 3003,
			reuseExistingServer: !process.env.CI,
		},
	],
});
