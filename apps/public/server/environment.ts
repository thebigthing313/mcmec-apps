/**
 * Which deployment this server process is. Read at runtime, on the server only — it never
 * reaches the browser bundle.
 *
 * `PUBLIC_ENV` is the explicit signal and is set on both Railway services.
 * `RAILWAY_ENVIRONMENT_NAME` is injected by the platform on every service and is the fallback,
 * so a service provisioned without any manual configuration still reports its environment
 * correctly rather than reporting nothing.
 */
const environment =
	process.env.PUBLIC_ENV || process.env.RAILWAY_ENVIRONMENT_NAME || "";

/**
 * Whether this is the live public website — the one origin allowed into search results.
 *
 * The test is deliberately "is it production?" rather than "is it staging?". Staging serves the
 * same pages as production from a database that gets truncated and reloaded during testing, and
 * this site is the Commission's official channel for legal notices, so an indexed staging copy
 * could surface a throwaway notice as though it were the statutory posting. Asking whether the
 * environment is staging fails **open**: a service missing the variable, or an environment added
 * later under a name nobody thought to check, would be indexed. Asking whether it is production
 * fails **closed** — the worst an unconfigured service can do is decline to be indexed, which is
 * visible in Search Console rather than silent.
 */
export const isProductionSite = environment === "production";
