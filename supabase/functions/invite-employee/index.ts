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
		const { email } = await req.json();

		// Validate input
		if (!email || typeof email !== "string") {
			return Response.json(
				{ error: "Email is required." },
				{ headers: corsHeaders, status: 400 },
			);
		}

		const normalizedEmail = email.toLowerCase().trim();

		// Create admin client with service role key
		const supabaseAdmin = createClient(
			Deno.env.get("SUPABASE_URL")!,
			Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
		);

		// Check if employee exists with this email
		const { data: employee, error: employeeError } = await supabaseAdmin
			.from("employees")
			.select("id, user_id")
			.eq("email", normalizedEmail)
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

		// Send invite email via Supabase Auth
		// Creates the auth user and sends a magic link email via Resend SMTP
		// Employee clicks the link → lands on central's /set-password page
		const { data: inviteData, error: inviteError } =
			await supabaseAdmin.auth.admin.inviteUserByEmail(normalizedEmail);

		if (inviteError || !inviteData.user) {
			return Response.json(
				{ error: inviteError?.message ?? "Unable to send invite." },
				{ headers: corsHeaders, status: 500 },
			);
		}

		// Link employee to the new auth user
		const { error: linkError } = await supabaseAdmin
			.from("employees")
			.update({ user_id: inviteData.user.id })
			.eq("id", employee.id);

		if (linkError) {
			// Clean up the created user if linking fails
			await supabaseAdmin.auth.admin.deleteUser(inviteData.user.id);
			return Response.json(
				{ error: "Invite sent but failed to link employee record." },
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
