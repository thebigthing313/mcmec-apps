import { MeetingsRowSchema } from "@mcmec/schemas/db/meetings";
import { createEagerCollection } from "../electric-collection";

/**
 * The Commission's meeting calendar. Central writes none of it — authoring is Website
 * Management's job under `manage_website` — but every employee may read the public record here.
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
