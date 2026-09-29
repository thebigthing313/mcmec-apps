/**
 * Central's two gates, as pure functions over the claims the root read once.
 *
 * They are App policy rather than session plumbing, so they live here and not in `@mcmec/auth`
 * (#242). Neither reads the session again: a route gate runs `requireAppRole(context.claims, …)`
 * against what the root layout resolved for this navigation. A role revoked mid-session takes
 * effect on the next navigation, and the API, which refuses writes and shapes itself, is the
 * real boundary.
 */
import { ForbiddenError, NoEmployeeError } from "@mcmec/auth/errors";
import type { Claims } from "@mcmec/auth/types";
import type { AppRole } from "@mcmec/lib/constants/roles";

/** Claims of a User whose login is linked to an Employee: everyone past the root. */
export type EmployeeClaims = Claims & { employeeId: string };

/**
 * The root's gate: a User with no linked Employee is refused by every App, the Self Service
 * Portal included, because every screen reads the signed-in person off their Employee row.
 * Throws `NoEmployeeError`, which renders full-page with no shell.
 */
export function requireEmployee(claims: Claims): EmployeeClaims {
	if (!claims.employeeId) {
		throw new NoEmployeeError();
	}
	return claims as EmployeeClaims;
}

/**
 * An App's gate, run in its layout route's `beforeLoad`. Throws `ForbiddenError`, which keeps
 * the URL and renders `AppRoleRequired` inside the shell.
 */
export function requireAppRole(claims: Claims, role: AppRole): void {
	if (!claims.permissions.includes(role)) {
		throw new ForbiddenError();
	}
}
