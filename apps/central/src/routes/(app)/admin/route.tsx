import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ADMIN_SHELL } from "@/src/components/admin-sidebar";
import { requireAppRole } from "@/src/lib/gates";

/**
 * Admin's layout: its App Role gate, its name and its rail, and nothing else.
 *
 * It asks the registry for no tables. The Users grid's Employee column reads `employees`, which
 * the root signed-in layout already put in context for the shell, so Admin shares that one
 * instance with the shell and with HR (#239).
 */
export const Route = createFileRoute("/(app)/admin")({
	beforeLoad: ({ context }) => requireAppRole(context.claims, "manage_users"),
	component: Outlet,
	loader: () => ({ crumb: "Admin" }),
	staticData: ADMIN_SHELL,
});
