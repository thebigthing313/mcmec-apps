/**
 * The one same-origin redirect guard, for every `/login?redirect=…` in the estate.
 *
 * A `redirect` search param is attacker-controllable — it arrives in a link — so a login that
 * honours it verbatim will happily bounce a freshly authenticated employee onto someone else's
 * site with the session cookie already set. Only a path is ever safe: it cannot leave the origin
 * the browser is already on.
 *
 * Two shapes have to be refused, and the second is the one hand-rolled copies forget. An absolute
 * URL (`https://evil.example`) does not start with `/`. A **protocol-relative** URL (`//evil.example`)
 * does, and the browser reads it as a host, not a path.
 *
 * This lived as four separate copies — one per staff application, three of them identical and
 * Central's written as an inline Zod refinement. A guard duplicated per app is a guard that gets
 * fixed in one app.
 *
 * @example
 * safeRedirect("/employees")          // "/employees"
 * safeRedirect("//evil.example")      // undefined
 * safeRedirect("https://evil.example") // undefined
 * safeRedirect(42)                     // undefined
 */
export function safeRedirect(value: unknown): string | undefined {
	if (typeof value !== "string") {
		return undefined;
	}
	if (!value.startsWith("/") || value.startsWith("//")) {
		return undefined;
	}
	return value;
}
