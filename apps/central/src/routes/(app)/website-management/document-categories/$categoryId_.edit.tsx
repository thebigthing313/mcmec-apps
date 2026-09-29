import { createFileRoute, notFound } from "@tanstack/react-router";
import { EditDocumentCategoryPage } from "@/src/apps/website-management/document-categories/edit-document-category-page";

export const Route = createFileRoute(
	"/(app)/website-management/document-categories/$categoryId_/edit",
)({
	component: EditDocumentCategoryPage,
	// Preloads what the screen subscribes to; a missing id is not-found, as on every record
	// route in central.
	loader: async ({ context, params }) => {
		await context.documentTypes.preload();
		const category = context.documentTypes.get(params.categoryId);
		if (!category) {
			throw notFound();
		}
		return { crumb: "Edit", category };
	},
});
