// Better Auth config.
//
// Reproduces the old Supabase-auth behavior on Better Auth:
//   - email + password, cross-subdomain SSO cookie on .middlesexmosquito.org
//   - code-defined roles (APP_ROLES, from @mcmec/lib) via the admin plugin
//   - customSession projects { employeeId, permissions } so the apps' verifyClaims() shape survives
//   - uuid ids to match the schema + the apps' z.uuid() validators

import { randomUUID } from "node:crypto";
import type { AppRole } from "@mcmec/lib/constants/roles";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, customSession } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/admin/access";
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
import { recordUserAudit } from "./user-audit";

// ── Access control: one coarse role per domain ───────────────────────────────
// Authorization in the apps is by role membership (see customSession -> permissions[]).
// The AC statements exist mainly so the admin plugin can gate its own endpoints.
//
// `defaultStatements` must be spread in: the plugin authorizes its own routes against its
// `user`/`session` statements, so a role built only from our custom ones can't satisfy them.
// (`adminRoles` does not cover this — it isn't consulted by the plugin's permission check.)
//
// The resources are the vocabulary's domains (#134/#135): `website`, `employees`, `users` and
// `reference`. `reference` ships zero commands — there is no municipality or zip-code screen to
// hang them off — but it is declared here with the cutover rather than the day that screen is
// written, so nothing has to be added in two places later.
const ac = createAccessControl({
	...defaultStatements,
	website: ["manage"],
	employees: ["manage"],
	users: ["manage"],
	reference: ["manage"],
});

// Typed `Record<AppRole, ...>`, so a role added to `APP_ROLES` fails this file's build until it
// has an AC role. That is the same exhaustiveness the command registry gets from `CommandName`.
const roles: Record<AppRole, ReturnType<typeof ac.newRole>> = {
	manage_employees: ac.newRole({ employees: ["manage"] }),
	// Grants nothing yet — the `reference` domain has no commands. Reserved so the permissions
	// grid can offer the column from the day the reference-data screen exists.
	manage_reference_data: ac.newRole({ reference: ["manage"] }),
	// Only what the admin app actually calls: it lists users, and writes roles through
	// `users.grantAppRole` / `users.revokeAppRole` rather than the plugin's set-role.
	manage_users: ac.newRole({ users: ["manage"], user: ["list", "get"] }),
	manage_website: ac.newRole({ website: ["manage"] }),
};

// `APP_ROLES` no longer lives here. It was declared twice — once in this file, once in
// `@mcmec/lib/constants/roles` under a comment asking someone to keep them in sync — and
// `@mcmec/domain` now needs it as well, to validate `users.grantAppRole`. Three copies of a
// list that `manage_reference_data` was about to be added to is how two of them end up wrong,
// so the API takes `@mcmec/lib`'s (#165). It is plain data with no imports, so taking it costs
// this bundle nothing.

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
		// Namespace the cookie per environment. Staging sits on sibling subdomains of the same
		// parent as production (`hr-staging.middlesexmosquito.org` beside
		// `hr.middlesexmosquito.org`), and the SSO cookie is scoped to that shared parent — so
		// without a distinct prefix both environments write the SAME cookie name at the SAME
		// scope. Signing into staging would clobber a production session and vice versa, and each
		// API would then receive the other environment's token and reject it, which surfaces as
		// sporadic unexplained logouts rather than as an error. Unset falls back to Better Auth's
		// "better-auth" default, which is correct for local dev (nothing else shares localhost).
		...(process.env.COOKIE_PREFIX
			? { cookiePrefix: process.env.COOKIE_PREFIX }
			: {}),
		// Cross-subdomain SSO cookie — gated on COOKIE_DOMAIN. In prod it's set to
		// `.middlesexmosquito.org`, so one session cookie is shared across every subdomain app.
		// In local dev COOKIE_DOMAIN is unset (there's no shared parent domain for localhost), so
		// we fall back to a host-only cookie on `localhost` — every localhost port already shares
		// it, giving the same free cross-app SSO in dev without a cross-site cookie.
		...(process.env.COOKIE_DOMAIN
			? {
					crossSubDomainCookies: { enabled: true },
					cookies: {
						sessionToken: {
							attributes: { domain: process.env.COOKIE_DOMAIN },
						},
					},
				}
			: {}),
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
	],

	// Audit for Better-Auth-initiated writes to `users` — sign-in, email verification, password
	// reset. NOT role changes or invites: those are `users.grantAppRole`, `users.revokeAppRole`
	// and `employees.inviteEmployee`, which write this table with Drizzle inside the command
	// transaction so the audit trigger sees the GUCs (#165). What is left here runs on Better
	// Auth's connection, outside our transactions, so `log_mutation` records it with a null actor
	// and a null command.
	//
	// `recordUserAudit` is a NO-OP today — the seam is wired so the implementation has one home
	// (see user-audit.ts). Behaviour is unchanged: the trigger still writes the row.
	databaseHooks: {
		user: {
			create: {
				after: async (user) => {
					await recordUserAudit({
						operation: "INSERT",
						recordId: user.id,
						actorUserId: null,
						actorEmail: null,
						command: null,
					});
				},
			},
			update: {
				after: async (user) => {
					await recordUserAudit({
						operation: "UPDATE",
						recordId: user.id,
						actorUserId: null,
						actorEmail: null,
						command: null,
					});
				},
			},
		},
	},
});
