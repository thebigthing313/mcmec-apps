import tsConfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

// Kept apart from vite.config.ts so a test run neither regenerates the route tree nor binds the
// dev server's port. Pure modules run in node; the route tests opt into happy-dom per file.
export default defineConfig({
	plugins: [tsConfigPaths()],
	test: {
		environment: "node",
	},
});
