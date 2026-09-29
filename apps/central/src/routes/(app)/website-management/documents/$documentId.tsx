import { createFileRoute, notFound } from "@tanstack/react-router";
import { DocumentPage } from "@/src/apps/website-management/documents/document-page";

export const Route = createFileRoute(
	"/(app)/website-management/documents/$documentId",
)({
	component: DocumentPage,
	// Preloads what the screen subscribes to; a missing id is not-found, as on every record
	// route in central.
	loader: async ({ context, params }) => {
		await Promise.all([
			context.documents.preload(),
			context.documentTypes.preload(),
		]);
		const document = context.documents.get(params.documentId);
		if (!document) {
			throw notFound();
		}
		const typeName =
			context.documentTypes.get(document.document_type_id)?.name ?? "Document";
		return { crumb: `${document.fiscal_year} ${typeName}`, document };
	},
});
