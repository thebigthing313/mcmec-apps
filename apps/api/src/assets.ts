/**
 * The shared brand images (logos, hero, favicon) that all six frontends reference.
 *
 * They used to live in a public Supabase Storage bucket. Serving them from the API keeps the
 * one property that bucket bought us — a single canonical origin, so the six apps share one
 * copy and one browser cache entry — without the Supabase dependency. `api` is the natural
 * host: it is the only always-on service that already exists in both environments.
 */

import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Hono } from "hono";

const ASSETS_DIR = resolve(
	dirname(fileURLToPath(import.meta.url)),
	"../assets",
);

// Byte-for-byte the `cacheControl` the Supabase upload set, so rehosting changes nothing a
// browser can observe. `immutable` is only safe because these filenames are stable and
// unversioned: a changed image needs a NEW filename, not a redeploy.
const CACHE_CONTROL = "public, max-age=31536000, immutable";

const CONTENT_TYPES: Record<string, string> = {
	".avif": "image/avif",
	".ico": "image/x-icon",
	".png": "image/png",
	".webp": "image/webp",
};

interface Asset {
	body: ArrayBuffer;
	contentType: string;
	etag: string;
}

/**
 * Read the whole set once at boot. It is ~2 MB, so holding it in memory is cheap — and it
 * means a request never carries a caller-supplied path to the filesystem, so traversal is
 * unreachable by construction rather than by validation.
 */
const assets = new Map<string, Asset>(
	readdirSync(ASSETS_DIR).flatMap((name): Array<[string, Asset]> => {
		const contentType = CONTENT_TYPES[extname(name)];
		if (!contentType) return [];

		const file = readFileSync(resolve(ASSETS_DIR, name));
		// readFileSync can return a view into a pooled ArrayBuffer, so copy out the slice that
		// belongs to this file rather than handing the whole pool to the response.
		const body = file.buffer.slice(
			file.byteOffset,
			file.byteOffset + file.byteLength,
		) as ArrayBuffer;

		return [
			[
				name,
				{
					body,
					contentType,
					etag: `"${createHash("sha256").update(file).digest("base64url")}"`,
				},
			],
		];
	}),
);

export const assetsRouter = new Hono();

assetsRouter.on(["GET", "HEAD"], "/:name", (c) => {
	const asset = assets.get(c.req.param("name"));
	if (!asset) return c.notFound();

	c.header("Cache-Control", CACHE_CONTROL);
	c.header("ETag", asset.etag);

	// Belt and braces next to `immutable`: a client that revalidates anyway (a hard refresh,
	// or a proxy that ignores `immutable`) gets a 304 instead of 2 MB.
	if (c.req.header("If-None-Match") === asset.etag) {
		return c.body(null, 304);
	}

	c.header("Content-Type", asset.contentType);
	// Set explicitly rather than left to the runtime: on a HEAD the adapter drops the body
	// before a length can be inferred from it, and the response would go out without one.
	c.header("Content-Length", String(asset.body.byteLength));
	return c.body(asset.body);
});
