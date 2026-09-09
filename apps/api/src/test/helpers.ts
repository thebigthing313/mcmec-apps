/**
 * What a boundary test needs, and nothing more.
 *
 * The suite drives the real Hono app over `app.request`, so routing, envelope parsing, the
 * permission gate, the dispatcher and every handler run exactly as they do in production.
 * Nothing here reaches past that door, on purpose (#184). How to run it, and why isolation
 * works the way it does, is in `apps/api/README.md`.
 */
import { randomUUID } from "node:crypto";
import type { AppRole } from "@mcmec/lib/constants/roles";
import { COMMAND_PATH } from "@mcmec/sync/routes";
import { getCookies } from "better-auth/cookies";
import { makeSignature } from "better-auth/crypto";
import { sql } from "drizzle-orm";
import { app } from "../app";
import { db } from "../db";
import { notices, noticeTypes, sessions, users } from "../db/schema";

/** A minimal Tiptap document — `content` is NOT NULL and the payload schema wants an object. */
export const MINIMAL_TIPTAP_DOC = {
	content: [{ content: [{ text: "Hello", type: "text" }], type: "paragraph" }],
	type: "doc",
};

/** A signed-in caller: the request headers, and the user id the audit and ledger rows carry. */
export type TestSession = {
	headers: Record<string, string>;
	userId: string;
};

/**
 * The tables this suite writes.
 *
 * `cascade` covers what a test did not write directly — the `notice_postings` entry a publish
 * appends, an `audit_log` row a trigger added — so a test never has to remember the ledger it
 * caused.
 */
const WRITTEN_TABLES = [
	"notices",
	"notice_types",
	"mosquito_activity_data",
	"audit_log",
	"sessions",
	"users",
] as const;

/** Isolation between tests. See `apps/api/README.md` for why it is truncation and not rollback. */
export async function resetDatabase(): Promise<void> {
	await db.execute(
		sql.raw(
			`truncate table ${WRITTEN_TABLES.map((t) => `public."${t}"`).join(", ")} restart identity cascade`,
		),
	);
}

/**
 * Signs a session cookie the way Better Auth does, so `getSessionInfo` resolves it.
 *
 * The cookie name comes from `getCookies` rather than being spelled out, so a change to the
 * cookie prefix moves this with it. The value is `${token}.${hmac}`, percent-encoded because
 * the signature is standard base64 and `+`/`=` are not cookie-safe.
 */
async function cookieHeaderFor(token: string): Promise<string> {
	const secret = process.env.BETTER_AUTH_SECRET;
	if (!secret) throw new Error("BETTER_AUTH_SECRET is unset in the test env");
	const { sessionToken } = getCookies({});
	const signed = `${token}.${await makeSignature(token, secret)}`;
	return `${sessionToken.name}=${encodeURIComponent(signed)}`;
}

/**
 * A caller holding exactly the roles named — which is to say, exactly those permissions.
 *
 * Roles are what the `users.role` column holds and what `customSession` splits back into
 * `permissions`, so "give me a caller who may not do this" is one argument. Typed `AppRole` so
 * a role that no longer exists fails the build rather than quietly granting nothing.
 */
export async function sessionWithRoles(
	roles: readonly AppRole[],
): Promise<TestSession> {
	const userId = randomUUID();
	await db.insert(users).values({
		email: `${userId}@example.test`,
		emailVerified: true,
		id: userId,
		name: "Test Caller",
		// The empty string is how "no app access" is spelled — `customSession` filters it back
		// to an empty permission list.
		role: roles.join(","),
	});

	const token = randomUUID().replace(/-/g, "");
	await db.insert(sessions).values({
		expiresAt: new Date(Date.now() + 86_400_000),
		id: randomUUID(),
		token,
		userId,
	});

	return { headers: { cookie: await cookieHeaderFor(token) }, userId };
}

export type CommandResponse = {
	body: { error?: string; issues?: unknown; reason?: string; txid?: string };
	status: number;
};

/** Sends one envelope through the real route. `session` omitted means an anonymous caller. */
export async function postCommand(
	envelope: unknown,
	session?: TestSession,
): Promise<CommandResponse> {
	const res = await app.request(COMMAND_PATH, {
		body: JSON.stringify(envelope),
		headers: {
			"content-type": "application/json",
			...(session?.headers ?? {}),
		},
		method: "POST",
	});
	const body = (await res.json().catch(() => ({}))) as CommandResponse["body"];
	return { body, status: res.status };
}

/** A notice type to hang notices off — `notices.notice_type_id` is NOT NULL and an FK. */
export async function seedNoticeType(): Promise<string> {
	const id = randomUUID();
	await db.insert(noticeTypes).values({ id, name: `Type ${id.slice(0, 8)}` });
	return id;
}

/** A stored notice, dated `daysAgo` days back so retention rules have something to read. */
export async function seedNotice(fields: {
	daysAgo: number;
	isPublished?: boolean;
	noticeTypeId: string;
	title?: string;
}): Promise<string> {
	const id = randomUUID();
	const date = new Date(Date.now() - fields.daysAgo * 86_400_000);
	await db.insert(notices).values({
		content: MINIMAL_TIPTAP_DOC,
		id,
		isArchived: false,
		isPublished: fields.isPublished ?? false,
		noticeDate: date.toISOString().slice(0, 10),
		noticeTypeId: fields.noticeTypeId,
		title: fields.title ?? "A stored notice",
	});
	return id;
}
