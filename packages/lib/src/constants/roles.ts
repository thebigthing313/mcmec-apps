/**
 * The application roles granted to a user account.
 *
 * Source of truth for the front-ends. The API declares the same list in
 * `apps/api/src/auth.ts` (`APP_ROLES`) because it builds independently of this
 * package — keep the two in sync.
 */
export const APP_ROLES = [
	"manage_website",
	"manage_employees",
	"manage_users",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

/** Short, user-facing label for each role (used in permission tables). */
export const APP_ROLE_LABELS: Record<AppRole, string> = {
	manage_employees: "Employees",
	manage_users: "Users",
	manage_website: "Website",
};

function isAppRole(value: string): value is AppRole {
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
