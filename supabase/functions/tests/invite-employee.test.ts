import {
	assert,
	assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "http://127.0.0.1:54321";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/invite-employee`;

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

	const { data } = await admin.auth.admin.listUsers();
	const user = data?.users?.find((u) => u.email === email);
	if (user) {
		await admin.auth.admin.deleteUser(user.id);
	}

	await admin.from("employees").update({ user_id: null }).eq("email", email);
}

Deno.test("should reject missing email", async () => {
	const res = await callFunction({});
	assertEquals(res.status, 400);
	const body = await res.json();
	assertEquals(body.error, "Email is required.");
});

Deno.test("should reject email not in employees table", async () => {
	const res = await callFunction({ email: "nonexistent@test.local" });
	assertEquals(res.status, 400);
	const body = await res.json();
	assertEquals(body.error, "No employee record found for this email.");
});

Deno.test("should reject email that already has an account", async () => {
	const res = await callFunction({ email: "admin@test.local" });
	assertEquals(res.status, 400);
	const body = await res.json();
	assertEquals(body.error, "An account already exists for this email.");
});

Deno.test("should send invite for unlinked employee", async () => {
	const res = await callFunction({ email: "unlinked@test.local" });
	assertEquals(res.status, 200);
	const body = await res.json();
	assert(body.success);

	await deleteTestUser("unlinked@test.local");
});

Deno.test("should reject second invite for same employee", async () => {
	const res1 = await callFunction({ email: "unlinked@test.local" });
	assertEquals(res1.status, 200);

	const res2 = await callFunction({ email: "unlinked@test.local" });
	assertEquals(res2.status, 400);
	const body = await res2.json();
	assertEquals(body.error, "An account already exists for this email.");

	await deleteTestUser("unlinked@test.local");
});
