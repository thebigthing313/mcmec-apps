import { tanstackRouter } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { bundleMembership } from "./bundle/membership-plugin";
import { MEMBERSHIP_FILE, REPO_ROOT } from "./bundle/paths";

export default defineConfig({
	plugins: [
		tsConfigPaths(),
		tanstackRouter({
			autoCodeSplitting: true,
			target: "react",
		}),
		viteReact(),
		// Feeds `pnpm check-bundle`, the entry-closure budget (#241).
		bundleMembership({ outFile: MEMBERSHIP_FILE, repoRoot: REPO_ROOT }),
	],
	server: {
		port: 3544,
		strictPort: true,
		// Browse via https://localhost:3444 (Caddy) — see the repo-root Caddyfile.
		hmr: { clientPort: 3444, protocol: "wss" },
	},
});
