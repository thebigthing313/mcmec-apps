import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/meetings")({
	// Asks for its children's table. It preloads nothing itself: this component is a bare
	// `<Outlet />` that subscribes to nothing, so the children's loaders do the preloading.
	beforeLoad: ({ context }) => context.collections.use("meetings"),
	component: RouteComponent,
	loader: () => ({ crumb: "Public Meetings" }),
});

function RouteComponent() {
	return <Outlet />;
}
