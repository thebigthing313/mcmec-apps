import { defineConfig } from "drizzle-kit";

// Migrations need DDL rights, which the app's least-privilege `app_rw` role deliberately
// lacks — so they run as the table owner via MIGRATION_DATABASE_URL.
//
// Falling back to DATABASE_URL keeps `db:generate` working locally, but note that drizzle-kit
// auto-loads apps/api/.env: run `db:migrate` without MIGRATION_DATABASE_URL and you'll quietly
// aim at whatever .env points to (staging, as app_rw) and get an opaque permission error. The
// warning below is what makes that legible — in a deploy log too, where an unset
// MIGRATION_DATABASE_URL means the migrate step fails and the old version keeps serving.
const url = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;

if (!url) {
	throw new Error(
		"Set MIGRATION_DATABASE_URL (or DATABASE_URL) to run drizzle-kit.",
	);
}

if (!process.env.MIGRATION_DATABASE_URL) {
	console.warn(
		"[drizzle] MIGRATION_DATABASE_URL is unset — falling back to DATABASE_URL. " +
			"That role has no DDL rights, so `migrate` will fail; set the owner URL to apply migrations.",
	);
}

export default defineConfig({
	schema: "./src/db/schema.ts",
	out: "./drizzle",
	dialect: "postgresql",
	dbCredentials: { url },
});
