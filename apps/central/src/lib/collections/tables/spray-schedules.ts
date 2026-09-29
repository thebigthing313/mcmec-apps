import { SpraySchedulesRowSchema } from "@mcmec/schemas/db/spray-schedules";
import { createEagerCollection } from "../electric-collection";

/** Spray Missions, written by Website Management through the `website.*SprayMission` commands. */
export function create(apiUrl: string) {
	return createEagerCollection({
		apiUrl,
		commands: true,
		schema: SpraySchedulesRowSchema,
		table: "spray_schedules",
	});
}
