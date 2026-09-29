import { defineConfig } from "vitest/config";

// Kept apart from vite.config.ts so a test run neither regenerates the route tree nor binds the
// dev server's port. The registry is plain TypeScript, so the suite runs in node.
export default defineConfig({
	test: {
		environment: "node",
	},
});
