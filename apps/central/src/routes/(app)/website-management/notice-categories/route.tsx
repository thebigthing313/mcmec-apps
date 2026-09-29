import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute(
	"/(app)/website-management/notice-categories",
)({
	// Asks for its children's tables and preloads none: this component is a bare `<Outlet />`
	// that subscribes to nothing, so each child's loader preloads what its screen reads.
	// `notices` is here for the count of what a category holds, which decides whether its Delete is offered.
	beforeLoad: ({ context }) =>
		context.websiteManagement.use("noticeTypes", "notices"),
	component: Outlet,
	loader: () => ({ crumb: "Notice Categories" }),
});
