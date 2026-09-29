import { ZipCodesRowSchema } from "@mcmec/schemas/db/zip-codes";
import { createEagerCollection } from "../electric-collection";

/** Read-only reference data: a Public Request's zip code resolves to its city and state here. */
export function create(apiUrl: string) {
	return createEagerCollection({
		apiUrl,
		schema: ZipCodesRowSchema,
		table: "zip_codes",
	});
}
