import path from "node:path";
import { defineConfig } from "vitest/config";

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
	},
});
