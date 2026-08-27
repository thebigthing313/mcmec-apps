import type { LayoutNavGroup } from "@mcmec/ui/mcmec-layout";
import { Layout } from "@mcmec/ui/mcmec-layout";
import { Link } from "@tanstack/react-router";
import { Home } from "lucide-react";

type NavLinkProps = { to: string };

/**
 * Central's rail.
 *
 * It previously rendered a group headed "My Apps" over empty content — a label promising a list
 * that was never built, on the one application every employee has. The applications a person can
 * reach are in the switcher directly above this, so the promise was also redundant. One honest
 * destination beats a heading over nothing.
 */
const NAV_GROUPS: Array<LayoutNavGroup<NavLinkProps>> = [
	{
		items: [{ icon: <Home />, label: "Dashboard", linkProps: { to: "/" } }],
	},
];

export function CentralSidebar() {
	return <Layout.Sidebar.Nav groups={NAV_GROUPS} LinkComponent={Link} />;
}
