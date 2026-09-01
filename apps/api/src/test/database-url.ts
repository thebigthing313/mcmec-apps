/**
 * Where the api tests find their database.
 *
 * Imported by `vitest.config.ts` — which runs in Vitest's own process — and by the global
 * setup that migrates, so the migrator and the workers cannot end up aimed at two different
 * databases.
 *
 * The default is the throwaway container `apps/api/README.md` documents; CI sets
 * `TEST_DATABASE_URL` at the port its service container publishes. Read the README before
 * pointing this anywhere else — the suite truncates.
 */
export const TEST_DATABASE_URL =
	process.env.TEST_DATABASE_URL ??
	"postgres://postgres:postgres@localhost:54329/mcmec_api_test";
