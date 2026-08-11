import { eq, useLiveQuery } from "@tanstack/react-db";
import { documents, documentTypes } from "../lib/db";

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
					documentType: document_type?.name,
					documentTypeId: document.document_type_id,
					fiscalYear: document.fiscal_year,
					id: document.id,
					isPublished: document.is_published,
					url: document.url,
				};
			}),
	);

	return { collection, data };
}
