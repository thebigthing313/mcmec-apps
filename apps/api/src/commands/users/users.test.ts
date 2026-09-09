/**
 * The `users` commands' one rule: you cannot revoke your own `manage_users` (#141).
 *
 * These run against a stand-in transaction rather than Postgres, because the rule being checked
 * is about the acting session and the envelope target — neither of which the database has an
 * opinion on. What the stand-in has to be faithful about is what a wrong guard would get wrong:
 * whether a write was issued at all, and which row it was issued against. So it reads the id out
 * of the `where` clause and records both, and the refusal is asserted as "no write was issued"
 * rather than merely as "it threw".
 */
import { describe, expect, it } from "vitest";
import type { Tx } from "../../actor";
import { NOT_FOUND } from "../rows";
import { CommandError } from "../types";
import { grantAppRole, revokeAppRole } from "./users";

const ADMIN = "11111111-1111-1111-1111-111111111111";
const OTHER = "22222222-2222-2222-2222-222222222222";
const MISSING = "33333333-3333-3333-3333-333333333333";

function session(userId: string) {
	return {
		employeeId: null,
		permissions: ["manage_users"],
		userEmail: "admin@example.test",
		userId,
	};
}

/**
 * The id a handler addressed, read back out of `eq(users.id, <id>)`.
 *
 * Drizzle renders a comparison into `queryChunks`, where the literal side is a `Param` holding
 * the raw value and every other chunk is a `StringChunk` holding an array of SQL fragments. The
 * one chunk whose `value` is a bare string is therefore the bound id. Without this the fake
 * would ignore its `where` entirely, and a handler that wrote to the WRONG user's row would
 * still pass the "revoking from someone else succeeds" test.
 */
function boundId(condition: unknown): string {
	const chunks = (condition as { queryChunks?: unknown[] }).queryChunks ?? [];
	for (const chunk of chunks) {
		const value = (chunk as { value?: unknown } | null)?.value;
		if (typeof value === "string") return value;
	}
	throw new Error("no bound id in condition");
}

/**
 * A Drizzle-shaped stand-in over a small table: `select().from().where().limit()` resolves to
 * the addressed row (or nothing, which is how `NOT_FOUND` is reached), and
 * `update().set().where()` records the id it wrote and the value it wrote there.
 */
function fakeTx(rows: Record<string, string | null>) {
	const writes: Array<{ id: string; role: string | null }> = [];
	const tx = {
		select: () => ({
			from: () => ({
				where: (condition: unknown) => ({
					limit: () => {
						const id = boundId(condition);
						return Promise.resolve(
							id in rows ? [{ role: rows[id] ?? null }] : [],
						);
					},
				}),
			}),
		}),
		update: () => ({
			set: (values: { role: string | null }) => ({
				where: (condition: unknown) => {
					writes.push({ id: boundId(condition), role: values.role });
					return Promise.resolve();
				},
			}),
		}),
	};
	return { tx: tx as unknown as Tx, writes };
}

describe("revokeAppRole", () => {
	it("refuses when an admin revokes their own manage_users", async () => {
		const { tx, writes } = fakeTx({ [ADMIN]: "manage_users,manage_website" });

		const error = await revokeAppRole({
			id: ADMIN,
			payload: { role: "manage_users" },
			session: session(ADMIN),
			tx,
		}).catch((e: unknown) => e);

		expect(error).toBeInstanceOf(CommandError);
		const refusal = error as CommandError;
		expect(refusal.status).toBe(409);
		expect(refusal.body.error).toBe("precondition_failed");
		expect(refusal.body.reason).toBe("self_revocation");
		// The UI renders the server's sentence, so it has to be one.
		expect(refusal.body.message).toMatch(/another administrator/i);
		// The role set is untouched: the guard refused before any write was issued.
		expect(writes).toEqual([]);
	});

	it("allows an admin to revoke manage_users from someone else", async () => {
		const { tx, writes } = fakeTx({
			[ADMIN]: "manage_users",
			[OTHER]: "manage_users,manage_website",
		});

		await revokeAppRole({
			id: OTHER,
			payload: { role: "manage_users" },
			session: session(ADMIN),
			tx,
		});

		expect(writes).toEqual([{ id: OTHER, role: "manage_website" }]);
	});

	it("allows an admin to revoke one of their own other roles", async () => {
		const { tx, writes } = fakeTx({ [ADMIN]: "manage_users,manage_website" });

		await revokeAppRole({
			id: ADMIN,
			payload: { role: "manage_website" },
			session: session(ADMIN),
			tx,
		});

		expect(writes).toEqual([{ id: ADMIN, role: "manage_users" }]);
	});

	it("still reports a missing user as not found", async () => {
		const { tx, writes } = fakeTx({ [ADMIN]: "manage_users" });

		const error = await revokeAppRole({
			id: MISSING,
			payload: { role: "manage_website" },
			session: session(ADMIN),
			tx,
		}).catch((e: unknown) => e);

		expect(error).toBe(NOT_FOUND);
		expect(writes).toEqual([]);
	});
});

describe("grantAppRole", () => {
	it("is untouched by the guard — granting yourself manage_users still writes", async () => {
		const { tx, writes } = fakeTx({ [ADMIN]: "manage_website" });

		await grantAppRole({
			id: ADMIN,
			payload: { role: "manage_users" },
			session: session(ADMIN),
			tx,
		});

		expect(writes).toEqual([
			{ id: ADMIN, role: "manage_website,manage_users" },
		]);
	});
});
