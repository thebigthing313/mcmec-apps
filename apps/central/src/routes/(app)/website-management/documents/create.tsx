import { createFileRoute } from "@tanstack/react-router";
import { CreateDocumentPage } from "@/src/apps/website-management/documents/create-document-page";

export const Route = createFileRoute(
	"/(app)/website-management/documents/create",
)({
	component: CreateDocumentPage,
	loader: async ({ context }) => {
		await context.documentTypes.preload();
		return { crumb: "Create" };
	},
});
