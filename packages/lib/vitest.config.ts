import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"@mcmec/lib": path.resolve(__dirname, "./src"),
		},
	},
	test: {
		environment: "node",
	},
});
