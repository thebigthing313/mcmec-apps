import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
	ForbiddenError,
	NotOnboardedError,
	UnauthenticatedError,
} from "../errors";
import { signIn } from "../signIn";
import { signOut } from "../signOut";
import { verifyClaims } from "../verifyClaims";
import { supabase, supabaseAdmin, TEST_USER } from "./setup";

describe("auth flow (integration)", () => {
	beforeAll(async () => {
		// Sign in with seed user
		await signIn({
			client: supabase,
			email: TEST_USER.email,
			password: TEST_USER.password,
		});
	});

	afterAll(async () => {
		await signOut({ client: supabase });
	});

	it("should verify claims for authenticated user", async () => {
		const claims = await verifyClaims({ client: supabase });

		expect(claims.userId).toBeDefined();
		expect(claims.userEmail).toBe(TEST_USER.email);
		expect(claims.employeeId).toBeDefined();
		expect(Array.isArray(claims.permissions)).toBe(true);
	});

	it("should include public_notices permission from seed data", async () => {
		const claims = await verifyClaims({ client: supabase });

		expect(claims.permissions).toContain("public_notices");
	});

	it("should pass permission check for public_notices", async () => {
		const claims = await verifyClaims({
			client: supabase,
			permission: "public_notices",
		});

		expect(claims.permissions).toContain("public_notices");
	});

	it("should throw ForbiddenError for missing permission", async () => {
		await expect(
			verifyClaims({
				client: supabase,
				permission: "nonexistent_permission",
			}),
		).rejects.toThrow(ForbiddenError);
	});
});

describe("unauthenticated access (integration)", () => {
	it("should throw UnauthenticatedError when not signed in", async () => {
		// Create a fresh client with no session
		const { createClient } = await import("@supabase/supabase-js");
		const anonClient = createClient(
			process.env.SUPABASE_URL ?? "http://127.0.0.1:54321",
			process.env.SUPABASE_ANON_KEY ?? "",
		);

		await expect(verifyClaims({ client: anonClient })).rejects.toThrow(
			UnauthenticatedError,
		);
	});
});
