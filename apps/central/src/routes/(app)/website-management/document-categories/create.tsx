import { createFileRoute } from "@tanstack/react-router";
import { CreateDocumentCategoryPage } from "@/src/apps/website-management/document-categories/create-document-category-page";

export const Route = createFileRoute(
	"/(app)/website-management/document-categories/create",
)({
	component: CreateDocumentCategoryPage,
	// Preloads nothing: the form subscribes to no table.
	loader: () => ({ crumb: "Create" }),
});
