import { SprayScheduleMunicipalitiesRowSchema } from "@mcmec/schemas/db/spray-schedule-municipalities";
import { createEagerCollection } from "../electric-collection";

/**
 * Which Municipalities each Spray Mission covers. Read-only everywhere: the set is replaced whole
 * by the command that writes the mission, its ids riding in that mutation's `arguments` (#162),
 * and the result syncs back here.
 */
export function create(apiUrl: string) {
	return createEagerCollection({
		apiUrl,
		schema: SprayScheduleMunicipalitiesRowSchema,
		table: "spray_schedule_municipalities",
	});
}
