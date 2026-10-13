import { StaffEventsRowSchema } from "@mcmec/schemas/db/staff-events";
import { createEagerCollection, datesAsText } from "../electric-collection";

/**
 * Staff Events. HR writes them under `manage_employees`; every signed-in Employee reads them (an
 * `authenticated` shape) on the Calendar.
 *
 * `datesAsText`, like `holidays`: `starts_on` and `ends_on` are days, typed as `YYYY-MM-DD`
 * strings, so they sync as strings too. The `time` columns need nothing — Electric's parser
 * leaves `time` as text already.
 */
export function create(apiUrl: string) {
	return createEagerCollection({
		apiUrl,
		commands: true,
		parser: datesAsText,
		schema: StaffEventsRowSchema,
		table: "staff_events",
	});
}
