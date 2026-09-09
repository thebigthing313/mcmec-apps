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
		port: 3547,
		strictPort: true,
		// Browse via https://localhost:3447 (Caddy). The HMR socket has to point at that
		// origin, not this port, or the client tries ws:// from an https page and is blocked
		// as mixed content. See the repo-root Caddyfile.
		hmr: { clientPort: 3447, protocol: "wss" },
	},
});
