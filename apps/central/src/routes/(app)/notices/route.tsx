import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/notices")({
	// Asks for its children's tables. It preloads nothing itself: this component is a bare
	// `<Outlet />` that subscribes to nothing, so the children's loaders do the preloading.
	beforeLoad: ({ context }) =>
		context.collections.use("notices", "noticeTypes"),
	component: RouteComponent,
	loader: () => ({ crumb: "Public Notices" }),
});

function RouteComponent() {
	return <Outlet />;
}
