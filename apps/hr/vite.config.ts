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
		port: 3003,
		strictPort: true,
		// Browse via https://localhost:3445 (Caddy) — see the repo-root Caddyfile.
		hmr: { clientPort: 3445, protocol: "wss" },
	},
});
