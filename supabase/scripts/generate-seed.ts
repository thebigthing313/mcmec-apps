/**
 * Generate seed data for local development.
 *
 * This script:
 * 1. Resets the database (applies migrations, no seeds)
 * 2. Creates auth users via GoTrue (proper password hashes)
 * 3. Inserts all other seed data via SQL
 * 4. Dumps the database to supabase/seeds/001_seed.sql
 *
 * Usage:
 *   supabase db reset --no-seed
 *   npx tsx supabase/scripts/generate-seed.ts
 *
 * Prerequisites: supabase must be running (supabase start)
 */

import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "http://127.0.0.1:54321";

// Get the service role key from supabase status
function getServiceRoleKey(): string {
	const output = execSync("supabase status -o env", { encoding: "utf-8" });
	const match = output.match(/SERVICE_ROLE_KEY="([^"]+)"/);
	if (!match)
		throw new Error("Could not extract SERVICE_ROLE_KEY from supabase status");
	return match[1];
}

const SERVICE_ROLE_KEY = getServiceRoleKey();
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ============================================================================
// Seed data definitions
// ============================================================================

// All test users share the same password
const TEST_PASSWORD = "password123";

// Employees with accounts (will be created via GoTrue + linked)
const LINKED_EMPLOYEES = [
	{
		email: "admin@test.local",
		display_name: "Adrian Kabigting",
		display_title: "Administrator",
		permissions: ["public_notices", "manage_employees", "admin_rights"],
	},
	{
		email: "jsmith@test.local",
		display_name: "John Smith",
		display_title: "Field Supervisor",
		permissions: ["public_notices"],
	},
	{
		email: "mgarcia@test.local",
		display_name: "Maria Garcia",
		display_title: "Lab Technician",
		permissions: ["public_notices"],
	},
	{
		email: "rjohnson@test.local",
		display_name: "Robert Johnson",
		display_title: "Operations Manager",
		permissions: ["public_notices", "manage_employees"],
	},
	{
		email: "ljones@test.local",
		display_name: "Lisa Jones",
		display_title: "Office Manager",
		permissions: ["public_notices", "manage_employees", "admin_rights"],
	},
	{
		email: "dwilliams@test.local",
		display_name: "David Williams",
		display_title: "Entomologist",
		permissions: [],
	},
];

// Employees without accounts (for testing invite flow)
const UNLINKED_EMPLOYEES = [
	{
		email: "kbrown@test.local",
		display_name: "Karen Brown",
		display_title: "Field Technician",
	},
	{
		email: "jdavis@test.local",
		display_name: "James Davis",
		display_title: "Seasonal Worker",
	},
	{
		email: "smartinez@test.local",
		display_name: "Sofia Martinez",
		display_title: "Lab Assistant",
	},
	{
		email: "tanderson@test.local",
		display_name: "Tom Anderson",
		display_title: null,
	},
];

const PERMISSIONS = [
	{
		permission_name: "public_notices",
		permission_description:
			"Manage public notices, meetings, insecticides, and service requests",
	},
	{
		permission_name: "manage_employees",
		permission_description: "Manage employee records and send account invites",
	},
	{
		permission_name: "admin_rights",
		permission_description: "Manage user permission assignments",
	},
];

const NOTICE_TYPES = [
	{ name: "General", description: "General public notices" },
	{ name: "Spraying", description: "Mosquito spraying schedule notices" },
	{ name: "Meeting", description: "Commission meeting notices" },
	{ name: "Advisory", description: "Public health advisories" },
];

const ZIP_CODES = [
	{ code: "08901", city: "New Brunswick", state: "NJ" },
	{ code: "08902", city: "North Brunswick", state: "NJ" },
	{ code: "08903", city: "New Brunswick", state: "NJ" },
	{ code: "08816", city: "East Brunswick", state: "NJ" },
	{ code: "08817", city: "Edison", state: "NJ" },
	{ code: "08820", city: "Edison", state: "NJ" },
	{ code: "08837", city: "Edison", state: "NJ" },
	{ code: "08840", city: "Metuchen", state: "NJ" },
	{ code: "08846", city: "Middlesex", state: "NJ" },
	{ code: "08854", city: "Piscataway", state: "NJ" },
	{ code: "08855", city: "Piscataway", state: "NJ" },
	{ code: "08857", city: "Old Bridge", state: "NJ" },
	{ code: "08859", city: "Parlin", state: "NJ" },
	{ code: "08861", city: "Perth Amboy", state: "NJ" },
	{ code: "08862", city: "Perth Amboy", state: "NJ" },
	{ code: "08863", city: "Fords", state: "NJ" },
	{ code: "08871", city: "Sayreville", state: "NJ" },
	{ code: "08872", city: "Sayreville", state: "NJ" },
	{ code: "08879", city: "South Amboy", state: "NJ" },
	{ code: "08882", city: "South River", state: "NJ" },
	{ code: "08884", city: "Spotswood", state: "NJ" },
	{ code: "08899", city: "Edison", state: "NJ" },
	{ code: "07001", city: "Avenel", state: "NJ" },
	{ code: "07064", city: "Port Reading", state: "NJ" },
	{ code: "07067", city: "Colonia", state: "NJ" },
	{ code: "07077", city: "Sewaren", state: "NJ" },
	{ code: "07080", city: "South Plainfield", state: "NJ" },
	{ code: "07095", city: "Woodbridge", state: "NJ" },
	{ code: "08810", city: "Dayton", state: "NJ" },
	{ code: "08812", city: "Dunellen", state: "NJ" },
	{ code: "08824", city: "Kendall Park", state: "NJ" },
	{ code: "08828", city: "Helmetta", state: "NJ" },
	{ code: "08830", city: "Iselin", state: "NJ" },
	{ code: "08831", city: "Monroe Township", state: "NJ" },
	{ code: "08832", city: "Jamesburg", state: "NJ" },
	{ code: "08850", city: "Milltown", state: "NJ" },
	{ code: "08852", city: "Monmouth Junction", state: "NJ" },
	{ code: "07008", city: "Carteret", state: "NJ" },
	{ code: "08536", city: "Plainsboro", state: "NJ" },
	{ code: "08540", city: "Princeton", state: "NJ" },
];

// ============================================================================
// Main
// ============================================================================

async function main() {
	console.log("=== Generating seed data ===\n");

	// 1. Create permissions first (needed before granting)
	console.log("1. Creating permissions...");
	const { error: permError } = await supabase
		.from("permissions")
		.insert(PERMISSIONS);
	if (permError)
		throw new Error(`Failed to create permissions: ${permError.message}`);

	// 2. Create auth users via GoTrue and link to employees
	console.log("2. Creating linked employees (with accounts)...");
	const allPermissionGrants: Array<{
		user_id: string;
		permission_name: string;
	}> = [];

	for (const emp of LINKED_EMPLOYEES) {
		const { data: userData, error: userError } =
			await supabase.auth.admin.createUser({
				email: emp.email,
				password: TEST_PASSWORD,
				email_confirm: true,
			});
		if (userError)
			throw new Error(
				`Failed to create user ${emp.email}: ${userError.message}`,
			);

		const userId = userData.user.id;

		const { error: empError } = await supabase.from("employees").insert({
			email: emp.email,
			user_id: userId,
			display_name: emp.display_name,
			display_title: emp.display_title,
		});
		if (empError)
			throw new Error(
				`Failed to create employee ${emp.email}: ${empError.message}`,
			);

		for (const perm of emp.permissions) {
			allPermissionGrants.push({ user_id: userId, permission_name: perm });
		}

		console.log(`   ${emp.display_name} (${emp.email})`);
	}

	// 3. Create unlinked employees (no accounts)
	console.log("3. Creating unlinked employees...");
	const { error: unlinkError } = await supabase.from("employees").insert(
		UNLINKED_EMPLOYEES.map((e) => ({
			email: e.email,
			display_name: e.display_name,
			display_title: e.display_title,
		})),
	);
	if (unlinkError)
		throw new Error(
			`Failed to create unlinked employees: ${unlinkError.message}`,
		);
	for (const emp of UNLINKED_EMPLOYEES) {
		console.log(`   ${emp.display_name} (${emp.email}) — no account`);
	}

	// 4. Grant permissions
	console.log("4. Granting permissions...");
	if (allPermissionGrants.length > 0) {
		const { error: grantError } = await supabase
			.from("user_permissions")
			.insert(allPermissionGrants);
		if (grantError)
			throw new Error(`Failed to grant permissions: ${grantError.message}`);
	}
	console.log(
		`   Granted ${allPermissionGrants.length} permission assignments`,
	);

	// 5. Create notice types
	console.log("5. Creating notice types...");
	const { error: ntError } = await supabase
		.from("notice_types")
		.insert(NOTICE_TYPES);
	if (ntError)
		throw new Error(`Failed to create notice types: ${ntError.message}`);

	// 6. Create notices
	console.log("6. Creating notices...");
	const { data: noticeTypes } = await supabase
		.from("notice_types")
		.select("id, name");
	const typeMap = Object.fromEntries(
		(noticeTypes ?? []).map((t) => [t.name, t.id]),
	);

	const { error: noticeError } = await supabase.from("notices").insert([
		{
			notice_type_id: typeMap.Spraying,
			title: "Aerial Spraying Scheduled — North District",
			content: {
				type: "doc",
				content: [
					{
						type: "paragraph",
						content: [
							{
								type: "text",
								text: "Aerial spraying for adult mosquitoes will take place in the North District on the evening of March 28. Residents are advised to stay indoors during application.",
							},
						],
					},
				],
			},
			notice_date: "2026-03-28",
			is_published: true,
		},
		{
			notice_type_id: typeMap.General,
			title: "Seasonal Reminder: Eliminate Standing Water",
			content: {
				type: "doc",
				content: [
					{
						type: "paragraph",
						content: [
							{
								type: "text",
								text: "As warmer weather approaches, please remove any standing water sources around your property to help reduce mosquito breeding.",
							},
						],
					},
				],
			},
			notice_date: "2026-03-15",
			is_published: true,
		},
		{
			notice_type_id: typeMap.Advisory,
			title: "West Nile Virus Activity Detected",
			content: {
				type: "doc",
				content: [
					{
						type: "paragraph",
						content: [
							{
								type: "text",
								text: "West Nile Virus has been detected in mosquito samples collected from the South District. Take precautions to avoid mosquito bites.",
							},
						],
					},
				],
			},
			notice_date: "2026-04-01",
			is_published: false,
		},
	]);
	if (noticeError)
		throw new Error(`Failed to create notices: ${noticeError.message}`);

	// 7. Create meetings
	console.log("7. Creating meetings...");
	const { error: meetError } = await supabase.from("meetings").insert([
		{
			name: "Regular Commission Meeting",
			meeting_at: "2026-04-09T19:00:00Z",
			location: "1 JFK Blvd, New Brunswick, NJ",
		},
		{
			name: "Regular Commission Meeting",
			meeting_at: "2026-05-14T19:00:00Z",
			location: "1 JFK Blvd, New Brunswick, NJ",
		},
		{
			name: "Special Budget Meeting",
			meeting_at: "2026-04-23T18:00:00Z",
			location: "1 JFK Blvd, New Brunswick, NJ",
		},
	]);
	if (meetError)
		throw new Error(`Failed to create meetings: ${meetError.message}`);

	// 8. Create insecticides
	console.log("8. Creating insecticides...");
	const { error: insError } = await supabase.from("insecticides").insert([
		{
			type_name: "Larvicide",
			active_ingredient: "Bacillus thuringiensis israelensis (Bti)",
			active_ingredient_url: "https://example.com/bti",
			trade_name: "VectoBac 12AS",
			label_url: "https://example.com/vectobac-label",
			msds_url: "https://example.com/vectobac-msds",
		},
		{
			type_name: "Adulticide",
			active_ingredient: "Sumithrin + PBO",
			active_ingredient_url: "https://example.com/sumithrin",
			trade_name: "Anvil 10+10 ULV",
			label_url: "https://example.com/anvil-label",
			msds_url: "https://example.com/anvil-msds",
		},
		{
			type_name: "Larvicide",
			active_ingredient: "Methoprene",
			active_ingredient_url: "https://example.com/methoprene",
			trade_name: "Altosid Pellets",
			label_url: "https://example.com/altosid-label",
			msds_url: "https://example.com/altosid-msds",
		},
	]);
	if (insError)
		throw new Error(`Failed to create insecticides: ${insError.message}`);

	// 9. Create zip codes
	console.log("9. Creating zip codes...");
	const { error: zipError } = await supabase
		.from("zip_codes")
		.insert(ZIP_CODES);
	if (zipError)
		throw new Error(`Failed to create zip codes: ${zipError.message}`);

	// 10. Create sample service requests
	console.log("10. Creating service requests...");
	const { data: zipData } = await supabase.from("zip_codes").select("id, code");
	const zipMap = Object.fromEntries((zipData ?? []).map((z) => [z.code, z.id]));

	const { error: contactError } = await supabase
		.from("contact_form_submissions")
		.insert({
			name: "Jane Doe",
			email: "jane@example.com",
			subject: "Question about spraying schedule",
			message: "When will spraying occur in the 08901 area?",
		});
	if (contactError)
		throw new Error(
			`Failed to create contact submission: ${contactError.message}`,
		);

	const { error: complaintError } = await supabase
		.from("adult_mosquito_complaints")
		.insert({
			full_name: "John Smith",
			phone: "732-555-0100",
			email: "john@example.com",
			address_line_1: "123 Main St",
			zip_code_id: zipMap["08901"],
			is_rear_of_property: true,
			is_dusk_dawn: true,
		});
	if (complaintError)
		throw new Error(`Failed to create complaint: ${complaintError.message}`);

	const { error: fishError } = await supabase
		.from("mosquito_fish_requests")
		.insert({
			full_name: "Maria Garcia",
			phone: "732-555-0200",
			email: "maria@example.com",
			address_line_1: "456 Oak Ave",
			zip_code_id: zipMap["08816"],
			location_of_water_body: "Backyard pond near fence line",
			type_of_water_body: "Pond",
		});
	if (fishError)
		throw new Error(`Failed to create fish request: ${fishError.message}`);

	const { error: waterError } = await supabase
		.from("water_management_requests")
		.insert({
			full_name: "Bob Johnson",
			phone: "732-555-0300",
			email: "bob@example.com",
			address_line_1: "789 Elm St",
			zip_code_id: zipMap["08854"],
			is_on_public_property: true,
			other_location_description: "Drainage ditch along Cedar Lane",
		});
	if (waterError)
		throw new Error(`Failed to create water request: ${waterError.message}`);

	console.log("\n=== All seed data created ===\n");

	// 11. Dump the database
	console.log("Dumping database...");
	// Use docker exec to run pg_dump inside the Supabase postgres container
	// Only dump auth and public schemas — exclude all Supabase internal schemas
	const containerName = "supabase_db_mcmec-db";
	const excludeTables = [
		"auth.schema_migrations",
		"auth.flow_state",
		"auth.audit_log_entries",
		"auth.refresh_tokens",
		"auth.mfa_amr_claims",
		"auth.mfa_challenges",
		"auth.mfa_factors",
		"auth.saml_providers",
		"auth.saml_relay_states",
		"auth.sessions",
		"auth.sso_domains",
		"auth.sso_providers",
		"auth.one_time_tokens",
	]
		.map((t) => `--exclude-table=${t}`)
		.join(" ");
	const dumpCmd = `docker exec ${containerName} pg_dump -U postgres --data-only --inserts --no-owner --no-privileges --schema=auth --schema=public ${excludeTables}`;

	const dump = execSync(dumpCmd, { encoding: "utf-8" });

	// Add header comment
	const header = `-- =============================================================================
-- Seed data for local development
-- Generated by: npx tsx supabase/scripts/generate-seed.ts
-- Test user: admin@test.local / password123
--
-- DO NOT EDIT MANUALLY — regenerate with:
--   supabase db reset --no-seed
--   npx tsx supabase/scripts/generate-seed.ts
-- =============================================================================

`;

	// Strip psql meta-commands that Supabase seeder doesn't understand
	const cleanedDump = dump
		.split("\n")
		.filter((line) => !line.startsWith("\\"))
		.join("\n");

	const seedPath = resolve(__dirname, "../seeds/001_seed.sql");
	writeFileSync(seedPath, header + cleanedDump);
	console.log(`Seed file written to: ${seedPath}`);
	console.log("\nDone! Run 'supabase db reset' to verify the seed works.");
}

main().catch((err) => {
	console.error("Error:", err.message);
	process.exit(1);
});
