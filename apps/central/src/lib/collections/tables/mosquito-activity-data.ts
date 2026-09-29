import { MosquitoActivityDataRowSchema } from "@mcmec/schemas/db/mosquito-activity-data";
import { createOnDemandCollection } from "../electric-collection";

/**
 * Weekly Mosquito Activity: thousands of rows, growing a season at a time, so on demand. Rows
 * arrive through `website.importMosquitoActivity`, which the weekly-activity screen sends
 * straight to the dispatcher (a whole year is replaced, so there is no optimistic row); the new
 * season streams back in here. `commands: true` all the same: the flag says how the TABLE is
 * written (#174).
 */
export function create(apiUrl: string) {
	return createOnDemandCollection({
		apiUrl,
		commands: true,
		schema: MosquitoActivityDataRowSchema,
		table: "mosquito_activity_data",
	});
}
