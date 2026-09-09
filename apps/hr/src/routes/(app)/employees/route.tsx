import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/employees")({
	component: RouteComponent,
	/**
	 * Carries the section's own crumb.
	 *
	 * Without a layout route here the index is the only thing declaring "Manage Employees", and an
	 * index only matches its exact path — so a drill-down to `/employees/<id>` skipped straight
	 * from Dashboard to the person's name, and the trail offered no way back to the list it came
	 * from. The shell collapses this against the index's identical crumb, so `/employees` still
	 * reads as one step.
	 */
	loader: () => ({ crumb: "Manage Employees" }),
});

function RouteComponent() {
	return <Outlet />;
}
