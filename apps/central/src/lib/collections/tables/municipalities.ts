import { MunicipalitiesRowSchema } from "@mcmec/schemas/db/municipalities";
import { createEagerCollection } from "../electric-collection";

/**
 * Read-only, and read-only on the server too: no command writes it (#159), so the collection
 * carries no `commands` and TanStack DB refuses a write. Spray Missions name the ones they cover.
 */
export function create(apiUrl: string) {
	return createEagerCollection({
		apiUrl,
		schema: MunicipalitiesRowSchema,
		table: "municipalities",
	});
}
