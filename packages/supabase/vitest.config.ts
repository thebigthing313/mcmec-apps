import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
	},
	resolve: {
		alias: {
			"@mcmec/lib": path.resolve(__dirname, "../../packages/lib/src"),
			"@mcmec/supabase": path.resolve(__dirname, "./src"),
		},
	},
});
