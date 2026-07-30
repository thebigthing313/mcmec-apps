// Better Auth config.
//
// Reproduces the old Supabase-auth behavior on Better Auth:
//   - email + password, cross-subdomain SSO cookie on .middlesexmosquito.org
//   - code-defined roles (manage_website / manage_employees / manage_users) via the admin plugin
//   - customSession projects { employeeId, permissions } so the apps' verifyClaims() shape survives
//   - uuid ids to match the schema + the apps' z.uuid() validators

import { randomUUID } from "node:crypto";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, customSession } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import { eq } from "drizzle-orm";
import { db } from "./db";
import {
	accounts,
	employees,
	sessions,
	users,
	verifications,
} from "./db/schema";
import { passwordSetupHtml, sendEmail } from "./email";

// ── Access control: three coarse roles, one per admin app ────────────────────
// Authorization in the apps is by role membership (see customSession -> permissions[]).
// The AC statements exist mainly so the admin plugin can gate its own endpoints.
const ac = createAccessControl({
	website: ["manage"],
	employees: ["manage"],
	users: ["manage"],
});

const roles = {
	manage_website: ac.newRole({ website: ["manage"] }),
	manage_employees: ac.newRole({ employees: ["manage"] }),
	manage_users: ac.newRole({ users: ["manage"] }),
};

// The assignable app roles (one per admin front-end). Source of truth for role-assignment
// validation; `users.role` stores a comma-separated subset of these (see customSession).
export const APP_ROLES = [
	"manage_website",
	"manage_employees",
	"manage_users",
] as const;
export type AppRole = (typeof APP_ROLES)[number];

export const auth = betterAuth({
	baseURL: process.env.BETTER_AUTH_URL, // https://api.middlesexmosquito.org
	secret: process.env.BETTER_AUTH_SECRET,

	database: drizzleAdapter(db, {
		provider: "pg",
		// explicit model -> table mapping (our tables are plural + snake_case)
		schema: {
			user: users,
			session: sessions,
			account: accounts,
			verification: verifications,
		},
	}),

	// Better Auth supplies a uuid for every id (matches our uuid columns); avoids relying on
	// DB-default read-back through the adapter.
	advanced: {
		database: { generateId: () => randomUUID() },
		crossSubDomainCookies: { enabled: true },
		// share the session cookie across every *.middlesexmosquito.org app
		cookies: {
			sessionToken: { attributes: { domain: process.env.COOKIE_DOMAIN } },
		},
	},

	trustedOrigins: (process.env.TRUSTED_ORIGINS ?? "")
		.split(",")
		.filter(Boolean),

	emailAndPassword: {
		enabled: true,
		// No public self-registration: accounts are created ONLY via the invite flow
		// (auth.api.createUser, server-side). Without this, POST /api/auth/sign-up/email is
		// world-reachable and a self-registered session could read the staff-only shapes.
		disableSignUp: true,
		requireEmailVerification: false, // invite → set-password link verifies ownership
		sendResetPassword: async ({ user, url }) => {
			await sendEmail({
				to: user.email,
				subject: "Set your MCMEC password",
				html: passwordSetupHtml(user.name, url),
			});
		},
	},

	session: {
		expiresIn: 60 * 60 * 24 * 7, // 7d
		updateAge: 60 * 60 * 24, // refresh daily
	},

	plugins: [
		admin({
			ac,
			roles,
			// only manage_users can hit the admin plugin endpoints directly; finer-grained
			// actions (invite gated by manage_employees) are exposed via our own Hono routes.
			adminRoles: ["manage_users"],
		}),

		// Reproduces the old JWT app_metadata claims from tables at session time.
		customSession(async ({ user, session }) => {
			const [employee] = await db
				.select({ id: employees.id })
				.from(employees)
				.where(eq(employees.userId, user.id))
				.limit(1);

			// admin plugin adds `role` at runtime; customSession types `user` from the base model.
			const userRole = (user as { role?: string | null }).role ?? "";
			const permissions = userRole
				.split(",")
				.map((r: string) => r.trim())
				.filter(Boolean);

			return {
				user,
				session,
				employeeId: employee?.id ?? null, // null => not onboarded (old NotOnboardedError)
				permissions, // e.g. ["manage_website","manage_employees"]
			};
		}),

		// NOTE: audit for users/role/ban changes is written app-layer via databaseHooks
		// (Better Auth writes users on its own connection, so the DB trigger can't see the actor):
		//   databaseHooks: { user: { update: { after: (u, ctx) => writeAuditRow(...) } } }
	],
});
