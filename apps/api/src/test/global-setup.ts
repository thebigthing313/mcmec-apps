/**
 * Brings the test database up to the schema the app expects — once, before any test file.
 *
 * Migrations run through `drizzle-orm`'s migrator rather than `drizzle-kit migrate`, because
 * drizzle-kit auto-loads `apps/api/.env` and would happily aim a truncating test suite at
 * whatever that file points to. Here the URL is passed in explicitly and comes from one place.
 *
 * `triggers.sql` is applied afterwards. The migrations do not carry it — `set_updated_at` and
 * the two audit triggers have no automated apply path in this repo — and without it the test
 * database would be missing behaviour the tests are allowed to observe. Everything in that file
 * is `create or replace` and its grants section is commentary, so re-running it is a no-op.
 */
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { TEST_DATABASE_URL } from "./database-url";

const here = dirname(fileURLToPath(import.meta.url));

export default async function setup(): Promise<void> {
	const pool = new Pool({ connectionString: TEST_DATABASE_URL });
	try {
		await pool.query("select 1");
	} catch (cause) {
		await pool.end().catch(() => {});
		throw new Error(
			`Could not reach the test database at ${TEST_DATABASE_URL}. ` +
				"apps/api/README.md has the one docker line that starts one.",
			{ cause },
		);
	}
	try {
		await migrate(drizzle(pool), {
			migrationsFolder: join(here, "..", "..", "drizzle"),
		});
		await pool.query(
			await readFile(join(here, "..", "db", "triggers.sql"), "utf8"),
		);
	} finally {
		await pool.end();
	}
}
