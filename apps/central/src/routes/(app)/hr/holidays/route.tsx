import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/hr/holidays")({
	// Asks for its children's table and preloads none: this component is a bare `<Outlet />`
	// that subscribes to nothing, so each child's loader preloads what its screen reads.
	beforeLoad: ({ context }) => context.hrTables.use("holidays"),
	component: Outlet,
	loader: () => ({ crumb: "Holidays" }),
});
