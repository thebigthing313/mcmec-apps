import { eq, useLiveQuery } from "@tanstack/react-db";
import { documents, documentTypes, employees } from "../lib/db";

export function useDocuments() {
	const { data, collection } = useLiveQuery((q) =>
		q
			.from({ document: documents })
			.innerJoin(
				{ document_type: documentTypes },
				({ document, document_type }) =>
					eq(document.document_type_id, document_type.id),
			)
			.select(({ document, document_type }) => {
				return {
					createdById: document.created_by,
					documentType: document_type?.name,
					documentTypeId: document.document_type_id,
					fiscalYear: document.fiscal_year,
					id: document.id,
					isPublished: document.is_published,
					url: document.url,
				};
			}),
	);

	const enriched = data.map((document) => ({
		...document,
		createdByName: document.createdById
			? (employees.get(document.createdById)?.display_name ?? null)
			: null,
	}));

	return { collection, data: enriched };
}
