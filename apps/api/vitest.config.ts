import path from "node:path";
import { defineConfig } from "vitest/config";
import { TEST_DATABASE_URL } from "./src/test/database-url";

export default defineConfig({
	resolve: {
		alias: {
			// `@mcmec/lib`'s exports map is extensionless (`./constants/*` -> `./src/constants/*`),
			// which Vite will not resolve on its own. Same alias the other test-bearing packages
			// carry, for the same reason.
			"@mcmec/lib": path.resolve(__dirname, "../../packages/lib/src"),
		},
	},
	test: {
		environment: "node",
		/**
		 * Migrations, applied once. The command-boundary suite drives the real route against a
		 * real Postgres (#184) — see `apps/api/README.md` for the one line that starts one.
		 */
		globalSetup: ["./src/test/global-setup.ts"],
		setupFiles: ["./src/test/setup.ts"],
		/**
		 * One database, isolated by truncation. Two files running at once would truncate each
		 * other's rows mid-request, so the suite is serial by construction rather than by every
		 * test remembering to use unique data.
		 */
		fileParallelism: false,
		/**
		 * Applied in the worker before a test file's imports run, which is what lets
		 * `src/db/index.ts` read `DATABASE_URL` at module scope and still see the test database.
		 * Nothing here is a real credential: `BETTER_AUTH_SECRET` only has to be the same string
		 * that signs the session cookie the helper mints and that Better Auth verifies when the
		 * request comes back in.
		 */
		env: {
			BETTER_AUTH_SECRET: "command-boundary-test-secret",
			BETTER_AUTH_URL: "http://localhost",
			DATABASE_URL: TEST_DATABASE_URL,
			TRUSTED_ORIGINS: "http://localhost",
		},
	},
});
