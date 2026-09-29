import { DocumentTypesRowSchema } from "@mcmec/schemas/db/document-types";
import { createEagerCollection } from "../electric-collection";

/** Document Categories. Website Management writes them; the documents screens name each Document by one. */
export function create(apiUrl: string) {
	return createEagerCollection({
		apiUrl,
		commands: true,
		schema: DocumentTypesRowSchema,
		table: "document_types",
	});
}
