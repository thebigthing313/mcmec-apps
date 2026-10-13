import { HolidaysRowSchema } from "@mcmec/schemas/db/holidays";
import { createEagerCollection, datesAsText } from "../electric-collection";

/**
 * The days the Commission closes. HR writes them under `manage_employees`; every signed-in
 * Employee reads them (an `authenticated` shape), for the Calendar and the Holiday Schedule.
 *
 * `datesAsText`: `observed_on` and `falls_on` are days, typed as `YYYY-MM-DD` strings by the row
 * schema, so they sync as strings too — otherwise a synced row would hold a Date where its
 * optimistic twin holds text.
 */
export function create(apiUrl: string) {
	return createEagerCollection({
		apiUrl,
		commands: true,
		parser: datesAsText,
		schema: HolidaysRowSchema,
		table: "holidays",
	});
}
