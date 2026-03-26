import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		include: ["src/__integration__/**/*.test.ts"],
		testTimeout: 30000,
	},
	resolve: {
		alias: {
			"@mcmec/lib": path.resolve(__dirname, "../../packages/lib/src"),
			"@mcmec/auth": path.resolve(__dirname, "./src"),
		},
	},
});
