import { createFileRoute, notFound } from "@tanstack/react-router";
import { DocumentCategoryPage } from "@/src/apps/website-management/document-categories/document-category-page";

export const Route = createFileRoute(
	"/(app)/website-management/document-categories/$categoryId",
)({
	component: DocumentCategoryPage,
	// Preloads what the screen subscribes to; a missing id is not-found, as on every record
	// route in central.
	loader: async ({ context, params }) => {
		await Promise.all([
			context.documentTypes.preload(),
			context.documents.preload(),
		]);
		const category = context.documentTypes.get(params.categoryId);
		if (!category) {
			throw notFound();
		}
		return { crumb: category.name, category };
	},
});
