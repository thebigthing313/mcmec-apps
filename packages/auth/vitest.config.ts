import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		exclude: ["src/__integration__/**", "node_modules/**"],
	},
	resolve: {
		alias: {
			"@mcmec/lib": path.resolve(__dirname, "../../packages/lib/src"),
			"@mcmec/auth": path.resolve(__dirname, "./src"),
		},
	},
});
