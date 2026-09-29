import { DocumentsRowSchema } from "@mcmec/schemas/db/documents";
import { createEagerCollection } from "../electric-collection";

/** The Documents the Commission publishes for transparency. Written by Website Management. */
export function create(apiUrl: string) {
	return createEagerCollection({
		apiUrl,
		commands: true,
		schema: DocumentsRowSchema,
		table: "documents",
	});
}
