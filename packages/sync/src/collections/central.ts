import { EmployeesRowSchema } from "@mcmec/schemas/db/employees";
import { MeetingsRowSchema } from "@mcmec/schemas/db/meetings";
import { NoticeTypesRowSchema } from "@mcmec/schemas/db/notice-types";
import { NoticesRowSchema } from "@mcmec/schemas/db/notices";
import { createEagerCollection } from "../factories";

export interface CreateCentralCollectionsOptions {
	/** API origin (VITE_API_URL) */
	apiUrl: string;
}

export function createCentralCollections({
	apiUrl,
}: CreateCentralCollectionsOptions) {
	// Read-only here, and `commands: true` all the same: the flag says how the TABLE is
	// written, not whether this app writes it (#174). `employees` cut over with #165.
	const employees = createEagerCollection({
		apiUrl,
		commands: true,
		schema: EmployeesRowSchema,
		table: "employees",
	});

	// The Commission group's two registers. Central writes neither — it is the one application
	// every signed-in employee has, and authoring these records is Website Management's job
	// under `manage_website`. They are here so an employee without that role can still read the
	// public record, which until now meant leaving the staff apps for the public website.
	//
	// `meetings` is a `publicAll` shape, so what arrives is exactly what a resident's browser
	// gets. `notices` is not: its policy hands any authenticated session the full table, drafts
	// included, so the "only what the public sees" rule the Central screens promise is applied
	// in those routes rather than here — a collection that quietly dropped rows would be a
	// second, invisible read rule disagreeing with the proxy's.
	const meetings = createEagerCollection({
		apiUrl,
		commands: true,
		schema: MeetingsRowSchema,
		table: "meetings",
	});

	const notices = createEagerCollection({
		apiUrl,
		commands: true,
		schema: NoticesRowSchema,
		table: "notices",
	});

	const noticeTypes = createEagerCollection({
		apiUrl,
		commands: true,
		schema: NoticeTypesRowSchema,
		table: "notice_types",
	});

	return {
		employees,
		meetings,
		noticeTypes,
		notices,
	};
}

export type CentralCollections = ReturnType<typeof createCentralCollections>;
