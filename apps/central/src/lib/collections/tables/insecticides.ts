import { InsecticidesRowSchema } from "@mcmec/schemas/db/insecticides";
import { createEagerCollection } from "../electric-collection";

/** The Insecticide catalogue. Written by Website Management; each Spray Mission names one. */
export function create(apiUrl: string) {
	return createEagerCollection({
		apiUrl,
		commands: true,
		schema: InsecticidesRowSchema,
		table: "insecticides",
	});
}
