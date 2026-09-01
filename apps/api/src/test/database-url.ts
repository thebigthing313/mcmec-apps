/**
 * Where the boundary tests find their database.
 *
 * Imported by `vitest.config.ts` — which runs in Vitest's own process — and by the global
 * setup that migrates, so the migrator and the workers cannot end up aimed at two different
 * databases.
 *
 * The default is the throwaway container documented in `apps/api/README.md`. It is a literal
 * rather than a required variable because a developer who has run that one `docker run` line
 * should be able to type `pnpm --filter api test` and have it work; CI sets
 * `TEST_DATABASE_URL` at the port its service container publishes.
 *
 * The port is 54329 on purpose. The repo's dev ports and the ports the concurrent project on
 * this machine reserves are both spoken for (see CLAUDE.md), and a test database that collides
 * with a real one is the worst outcome available — this suite truncates between tests.
 */
export const TEST_DATABASE_URL =
	process.env.TEST_DATABASE_URL ??
	"postgres://postgres:postgres@localhost:54329/mcmec_api_test";
