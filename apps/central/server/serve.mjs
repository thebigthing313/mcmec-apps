// central's production server: the built SPA in `dist/`, on Railway.
//
// sirv-cli served it until #317's staging check, but it sends no Cache-Control at all, so a
// browser guessed a freshness for index.html from Last-Modified and kept running the old build
// after a deploy until someone reloaded. Here the app shell always revalidates (cheap, it has
// an ETag) and Vite's content-hashed `/assets/*` are kept for a year, since a new build gives
// them new names.

import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import sirv from "sirv";

const HASHED = /^\/assets\//;

/** @param {string} dir */
export function createHandler(dir) {
	return sirv(dir, {
		etag: true,
		setHeaders(res, pathname) {
			res.setHeader(
				"Cache-Control",
				HASHED.test(pathname)
					? "public, max-age=31536000, immutable"
					: "no-cache",
			);
		},
		// The SPA fallback: every deep link gets index.html. sirv never falls back for a path with
		// a file extension, so a missing asset is a 404, not the app shell.
		single: true,
	});
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const dir = fileURLToPath(new URL("../dist", import.meta.url));
	const port = Number(process.env.PORT) || 8080;
	// 0.0.0.0, not localhost: in a container loopback is unreachable and Railway returns 502.
	createServer(createHandler(dir)).listen(port, "0.0.0.0", () => {
		console.log(`central serving ${dir} on :${port}`);
	});
}
