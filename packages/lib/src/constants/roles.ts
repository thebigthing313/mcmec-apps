/**
 * The application roles granted to a user account.
 *
 * The ONE copy. `apps/api/src/auth.ts` declared a second one for as long as the API had no
 * reason to depend on this package; `@mcmec/domain` now needs the list too — `users.grantAppRole`
 * validates its payload against it — and three copies of a list that `manage_reference_data` was
 * about to be added to is how two of them end up wrong. The API imports it through the
 * vocabulary, which is where a permission name already lives.
 *
 * Nothing else in this file changed with that move: it is still plain data with no imports, so
 * taking it costs the API and the domain package nothing.
 */
export const APP_ROLES = [
	"manage_website",
	"manage_employees",
	"manage_users",
	/**
	 * Reserved with the cutover, and grants access to nothing yet.
	 *
	 * #134 gave the `reference` domain zero commands — municipality and zip-code management has
	 * no screen to hang them off — but the role, its AC resource and its column in the
	 * permissions grid land now rather than later, so the grid does not have to grow a column
	 * the day that screen is written. A reviewer reading an unused permission as a mistake is
	 * the reason this comment is here.
	 */
	"manage_reference_data",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

/** Short, user-facing label for each role (used in permission tables). */
export const APP_ROLE_LABELS: Record<AppRole, string> = {
	manage_employees: "Employees",
	manage_reference_data: "Reference Data",
	manage_users: "Users",
	manage_website: "Website",
};

export function isAppRole(value: string): value is AppRole {
	return (APP_ROLES as readonly string[]).includes(value);
}

/**
 * Parses Better Auth's comma-separated `users.role` column into known roles.
 * Unrecognized entries are dropped.
 */
export function parseRoles(role: string | null | undefined): AppRole[] {
	if (!role) return [];
	return role
		.split(",")
		.map((r) => r.trim())
		.filter(isAppRole);
}

/**
 * Renders a role set back into the `users.role` column, ordered by `APP_ROLES`.
 *
 * Canonical order so the stored string is stable — two admins granting the same two roles in
 * different orders write the same value, and the audit diff shows a role moving rather than a
 * list being reshuffled. `null` for the empty set, which is what "no app access" is spelled as.
 */
export function serializeRoles(roles: readonly AppRole[]): string | null {
	const ordered = APP_ROLES.filter((role) => roles.includes(role));
	return ordered.length ? ordered.join(",") : null;
}
