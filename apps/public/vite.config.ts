import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	plugins: [
		tailwindcss(),
		tsConfigPaths({
			projects: ["./tsconfig.json"],
		}),
		tanstackStart(),
		nitro(),
		viteReact(),
	],
	server: {
		port: 3007,
		strictPort: true,
		// Browse via https://localhost:3448 (Caddy) — see the repo-root Caddyfile.
		hmr: { clientPort: 3448, protocol: "wss" },
	},
});
