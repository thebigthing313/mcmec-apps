/**
 * Upload shared assets to Supabase Storage with cache-control headers.
 *
 * Usage:
 *   1. Copy packages/assets/.env.example to packages/assets/.env and fill in values
 *   2. pnpm tsx --env-file=packages/assets/.env packages/assets/scripts/upload-to-storage.ts
 *
 * This creates a public "assets" bucket (if it doesn't exist) and uploads
 * all images from packages/assets/images/ with a 1-year cache-control header.
 *
 * After uploading, update packages/assets/src/urls.ts with the public URLs.
 */

import { readdirSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
	console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
	process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const BUCKET = "assets";
const CACHE_CONTROL = "public, max-age=31536000, immutable";
const IMAGES_DIR = resolve(__dirname, "../images");

const MIME_TYPES: Record<string, string> = {
	".avif": "image/avif",
	".ico": "image/x-icon",
	".png": "image/png",
	".webp": "image/webp",
};

async function main() {
	// Ensure bucket exists and is public
	const { data: buckets } = await supabase.storage.listBuckets();
	const exists = buckets?.some((b) => b.name === BUCKET);

	if (!exists) {
		const { error } = await supabase.storage.createBucket(BUCKET, {
			public: true,
		});
		if (error) throw new Error(`Failed to create bucket: ${error.message}`);
		console.log(`Created public bucket: ${BUCKET}`);
	}

	// Upload each file
	const files = readdirSync(IMAGES_DIR);
	const urls: Record<string, string> = {};

	for (const file of files) {
		const ext = extname(file);
		const contentType = MIME_TYPES[ext] ?? "application/octet-stream";
		const filePath = resolve(IMAGES_DIR, file);
		const fileBuffer = readFileSync(filePath);

		const { error } = await supabase.storage
			.from(BUCKET)
			.upload(file, fileBuffer, {
				cacheControl: CACHE_CONTROL,
				contentType,
				upsert: true,
			});

		if (error) {
			console.error(`Failed to upload ${file}: ${error.message}`);
			continue;
		}

		const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(file);

		urls[file] = urlData.publicUrl;
		console.log(`Uploaded: ${file} → ${urlData.publicUrl}`);
	}

	// Print the constants file content
	console.log("\n=== Copy this into packages/assets/src/urls.ts ===\n");

	const camelCase = (name: string) =>
		name
			.replace(/\.[^.]+$/, "")
			.replace(/[-.](\w)/g, (_, c) => c.toUpperCase())
			.replace(/^(\w)/, (_, c) => c.toLowerCase());

	const lines = Object.entries(urls)
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([file, url]) => `export const ${camelCase(file)} = "${url}";`);

	console.log(lines.join("\n"));
}

main().catch((err) => {
	console.error("Error:", err.message);
	process.exit(1);
});
