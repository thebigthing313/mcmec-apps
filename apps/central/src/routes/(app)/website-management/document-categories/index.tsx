// validateSearch is never code-split, so it imports the component-free half.
import { validateRecordIndexSearch } from "@mcmec/ui/blocks/record-index-search";
import { createFileRoute } from "@tanstack/react-router";
import { DocumentCategoriesPage } from "@/src/apps/website-management/document-categories/document-categories-page";

export const Route = createFileRoute(
	"/(app)/website-management/document-categories/",
)({
	component: DocumentCategoriesPage,
	loader: async ({ context }) => {
		await Promise.all([
			context.documentTypes.preload(),
			context.documents.preload(),
		]);
		return { crumb: "Document Categories" };
	},
	validateSearch: validateRecordIndexSearch,
});
