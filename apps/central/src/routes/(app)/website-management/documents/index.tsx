// validateSearch is never code-split, so it imports the component-free half.
import { validateRecordIndexSearch } from "@mcmec/ui/blocks/record-index-search";
import { createFileRoute } from "@tanstack/react-router";
import { DocumentsPage } from "@/src/apps/website-management/documents/documents-page";

export const Route = createFileRoute("/(app)/website-management/documents/")({
	component: DocumentsPage,
	loader: async ({ context }) => {
		await Promise.all([
			context.documents.preload(),
			context.documentTypes.preload(),
		]);
		return { crumb: "Documents" };
	},
	validateSearch: validateRecordIndexSearch,
});
