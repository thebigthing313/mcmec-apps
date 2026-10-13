import { createFileRoute, Outlet } from "@tanstack/react-router";
import { HR_SHELL } from "@/src/components/hr-sidebar";
import { requireAppRole } from "@/src/lib/gates";

/**
 * HR's layout: its App Role gate, its name and its rail.
 *
 * It asks the registry for no tables. The Employees screens read `employees`, which the root
 * signed-in layout already put in context for the shell, so HR shares that one instance (#239).
 * Holidays and Staff Events ask for their own, through `context.hrTables` — returned only once the
 * gate has let the User in, for the reason Website Management's layout gives: every `beforeLoad`
 * in a match runs even after an earlier one throws, so asking `context.collections` directly
 * would build HR's tables for a User this gate had just refused.
 */
export const Route = createFileRoute("/(app)/hr")({
	beforeLoad: ({ context }) => {
		requireAppRole(context.claims, "manage_employees");
		return { hrTables: context.collections };
	},
	component: Outlet,
	loader: () => ({ crumb: "HR" }),
	staticData: HR_SHELL,
});
