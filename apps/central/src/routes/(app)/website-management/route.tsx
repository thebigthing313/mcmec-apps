import { createFileRoute, Outlet } from "@tanstack/react-router";
import { WEBSITE_MANAGEMENT_SHELL } from "@/src/components/website-management-sidebar";
import { requireAppRole } from "@/src/lib/gates";

/**
 * Website Management's layout: its App Role gate, its name and its rail.
 *
 * It asks the registry for no tables (#239); each screen asks for its own. But its routes ask
 * through `context.websiteManagementTables`, which this gate returns only once it has let the User in,
 * never through `context.collections` directly. TanStack Router runs every `beforeLoad` in a
 * match even after an earlier one has thrown (only the loaders stop at the first failure), so a
 * route asking the registry directly would download and build its tables for a User this gate
 * had just refused. When the gate throws, `websiteManagementTables` is absent, the route's ask fails
 * on a match that never renders, and the refusal is what the User sees.
 */
export const Route = createFileRoute("/(app)/website-management")({
	beforeLoad: ({ context }) => {
		requireAppRole(context.claims, "manage_website");
		return { websiteManagementTables: context.collections };
	},
	component: Outlet,
	loader: () => ({ crumb: "Website Management" }),
	staticData: WEBSITE_MANAGEMENT_SHELL,
});
