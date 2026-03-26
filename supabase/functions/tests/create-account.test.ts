import {
	assert,
	assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "http://127.0.0.1:54321";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/create-account`;

async function callFunction(body: Record<string, unknown>): Promise<Response> {
	return fetch(FUNCTION_URL, {
		body: JSON.stringify(body),
		headers: {
			Authorization: `Bearer ${ANON_KEY}`,
			"Content-Type": "application/json",
		},
		method: "POST",
	});
}

async function deleteTestUser(email: string): Promise<void> {
	const { createClient } = await import("jsr:@supabase/supabase-js@2");
	const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

	// Find and delete auth user by email
	const { data } = await admin.auth.admin.listUsers();
	const user = data?.users?.find((u) => u.email === email);
	if (user) {
		await admin.auth.admin.deleteUser(user.id);
	}

	// Unlink employee
	await admin.from("employees").update({ user_id: null }).eq("email", email);
}

Deno.test("should reject missing email", async () => {
	const res = await callFunction({ password: "password123" });
	assertEquals(res.status, 400);
	const body = await res.json();
	assertEquals(body.error, "Email is required.");
});

Deno.test("should reject missing password", async () => {
	const res = await callFunction({ email: "test@test.local" });
	assertEquals(res.status, 400);
	const body = await res.json();
	assertEquals(body.error, "Password must be at least 6 characters.");
});

Deno.test("should reject short password", async () => {
	const res = await callFunction({
		email: "test@test.local",
		password: "short",
	});
	assertEquals(res.status, 400);
	const body = await res.json();
	assertEquals(body.error, "Password must be at least 6 characters.");
});

Deno.test("should reject email not in employees table", async () => {
	const res = await callFunction({
		email: "nonexistent@test.local",
		password: "password123",
	});
	assertEquals(res.status, 400);
	const body = await res.json();
	assertEquals(body.error, "No employee record found for this email.");
});

Deno.test("should reject email that already has an account", async () => {
	// admin@test.local is seeded with a linked user_id
	const res = await callFunction({
		email: "admin@test.local",
		password: "password123",
	});
	assertEquals(res.status, 400);
	const body = await res.json();
	assertEquals(body.error, "An account already exists for this email.");
});

Deno.test("should create account for unlinked employee", async () => {
	// unlinked@test.local is seeded without a user_id
	const res = await callFunction({
		email: "unlinked@test.local",
		password: "password123",
	});
	assertEquals(res.status, 200);
	const body = await res.json();
	assert(body.success);

	// Clean up: delete the created user and unlink employee
	await deleteTestUser("unlinked@test.local");
});

Deno.test("should reject second account creation for same employee", async () => {
	// Create account first
	const res1 = await callFunction({
		email: "unlinked@test.local",
		password: "password123",
	});
	assertEquals(res1.status, 200);

	// Try again — should fail
	const res2 = await callFunction({
		email: "unlinked@test.local",
		password: "password123",
	});
	assertEquals(res2.status, 400);
	const body = await res2.json();
	assertEquals(body.error, "An account already exists for this email.");

	// Clean up
	await deleteTestUser("unlinked@test.local");
});
