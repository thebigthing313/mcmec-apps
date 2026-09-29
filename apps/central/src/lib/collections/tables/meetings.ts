import { MeetingsRowSchema } from "@mcmec/schemas/db/meetings";
import { createEagerCollection } from "../electric-collection";

/**
 * The Commission's meeting calendar. Website Management writes it under `manage_website`; the
 * Self Service Portal's read-only `/meetings` reads the same instance.
 *
 * `meetings` is a `publicAll` shape, so what arrives is exactly what a resident's browser gets.
 */
export function create(apiUrl: string) {
	return createEagerCollection({
		apiUrl,
		commands: true,
		schema: MeetingsRowSchema,
		table: "meetings",
	});
}
