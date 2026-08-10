import { tanstackRouter } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	plugins: [
		tsConfigPaths(),
		tanstackRouter({
			autoCodeSplitting: true,
			target: "react",
		}),
		viteReact(),
	],
	server: {
		port: 3004,
		strictPort: true,
		// Browse via https://localhost:3446 (Caddy) — see the repo-root Caddyfile.
		hmr: { clientPort: 3446, protocol: "wss" },
	},
});
