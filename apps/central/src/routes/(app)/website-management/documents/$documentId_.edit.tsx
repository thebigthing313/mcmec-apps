import { createFileRoute, notFound } from "@tanstack/react-router";
import { EditDocumentPage } from "@/src/apps/website-management/documents/edit-document-page";

export const Route = createFileRoute(
	"/(app)/website-management/documents/$documentId_/edit",
)({
	component: EditDocumentPage,
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
		return { crumb: "Edit", document };
	},
});
