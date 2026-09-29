import { createFileRoute, Outlet } from "@tanstack/react-router";
import { HR_SHELL } from "@/src/components/hr-sidebar";
import { requireAppRole } from "@/src/lib/gates";

/**
 * HR's layout: its App Role gate, its name and its rail, and nothing else.
 *
 * It asks the registry for no tables. Every HR screen reads `employees`, which the root signed-in
 * layout already put in context for the shell, so HR shares that one instance (#239).
 */
export const Route = createFileRoute("/(app)/hr")({
	beforeLoad: ({ context }) =>
		requireAppRole(context.claims, "manage_employees"),
	component: Outlet,
	loader: () => ({ crumb: "HR" }),
	staticData: HR_SHELL,
});
