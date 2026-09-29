import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/hr/employees")({
	component: Outlet,
	/**
	 * Carries the list's crumb, so a drill-down to `/hr/employees/<id>` offers the way back to the
	 * list. The shell collapses it against the index's identical crumb, so `/hr/employees` still
	 * reads as one step.
	 */
	loader: () => ({ crumb: "Employees" }),
});
