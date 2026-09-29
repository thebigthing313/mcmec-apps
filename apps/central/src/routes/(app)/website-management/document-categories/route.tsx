import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute(
	"/(app)/website-management/document-categories",
)({
	// Asks for its children's tables and preloads none: this component is a bare `<Outlet />`
	// that subscribes to nothing, so each child's loader preloads what its screen reads.
	// `documents` is here for the count of what a category holds, which decides whether its Delete is offered.
	beforeLoad: ({ context }) =>
		context.websiteManagementTables.use("documentTypes", "documents"),
	component: Outlet,
	loader: () => ({ crumb: "Document Categories" }),
});
