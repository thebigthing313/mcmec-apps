import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
	"Access-Control-Allow-Methods": "POST, OPTIONS",
	"Access-Control-Allow-Origin": "*",
};

Deno.serve(async (req) => {
	// Handle CORS preflight
	if (req.method === "OPTIONS") {
		return new Response(null, { headers: corsHeaders, status: 204 });
	}

	if (req.method !== "POST") {
		return Response.json(
			{ error: "Method not allowed" },
			{ headers: corsHeaders, status: 405 },
		);
	}

	try {
		const { email, password } = await req.json();

		// Validate input
		if (!email || typeof email !== "string") {
			return Response.json(
				{ error: "Email is required." },
				{ headers: corsHeaders, status: 400 },
			);
		}

		if (!password || typeof password !== "string" || password.length < 6) {
			return Response.json(
				{ error: "Password must be at least 6 characters." },
				{ headers: corsHeaders, status: 400 },
			);
		}

		// Create admin client with service role key
		const supabaseAdmin = createClient(
			Deno.env.get("SUPABASE_URL")!,
			Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
		);

		// Check if employee exists with this email
		const { data: employee, error: employeeError } = await supabaseAdmin
			.from("employees")
			.select("id, user_id")
			.eq("email", email.toLowerCase().trim())
			.maybeSingle();

		if (employeeError) {
			return Response.json(
				{ error: "Unable to verify employee record." },
				{ headers: corsHeaders, status: 500 },
			);
		}

		if (!employee) {
			return Response.json(
				{ error: "No employee record found for this email." },
				{ headers: corsHeaders, status: 400 },
			);
		}

		if (employee.user_id) {
			return Response.json(
				{ error: "An account already exists for this email." },
				{ headers: corsHeaders, status: 400 },
			);
		}

		// Create auth user
		const { data: newUser, error: createError } =
			await supabaseAdmin.auth.admin.createUser({
				email: email.toLowerCase().trim(),
				email_confirm: true,
				password,
			});

		if (createError || !newUser.user) {
			return Response.json(
				{ error: createError?.message ?? "Unable to create account." },
				{ headers: corsHeaders, status: 500 },
			);
		}

		// Link employee to the new auth user
		const { error: linkError } = await supabaseAdmin
			.from("employees")
			.update({ user_id: newUser.user.id })
			.eq("id", employee.id);

		if (linkError) {
			// Attempt to clean up the created user
			await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
			return Response.json(
				{ error: "Account created but failed to link employee record." },
				{ headers: corsHeaders, status: 500 },
			);
		}

		return Response.json(
			{ success: true },
			{ headers: corsHeaders, status: 200 },
		);
	} catch {
		return Response.json(
			{ error: "An unexpected error occurred." },
			{ headers: corsHeaders, status: 500 },
		);
	}
});
