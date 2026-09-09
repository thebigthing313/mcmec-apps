import type { LayoutNavGroup } from "@mcmec/ui/mcmec-layout";
import { Layout } from "@mcmec/ui/mcmec-layout";
import { Link } from "@tanstack/react-router";
import { CalendarDays, FileText, Home } from "lucide-react";

type NavLinkProps = { to: string };

/**
 * Central's rail.
 *
 * It previously rendered a group headed "My Apps" over empty content — a label promising a list
 * that was never built, on the one application every employee has. The applications a person can
 * reach are in the switcher directly above this, so the promise was also redundant.
 *
 * "Commission" is the first group here that earns its label: it names the public record — what
 * the Commission has published and what it has called — as distinct from Dashboard, which is
 * where you are rather than what you are reading. The Dashboard group stays unlabelled, per
 * DESIGN.md's rule that a label is not invented for a lone destination.
 */
const NAV_GROUPS: Array<LayoutNavGroup<NavLinkProps>> = [
	{
		items: [{ icon: <Home />, label: "Dashboard", linkProps: { to: "/" } }],
	},
	{
		items: [
			{
				icon: <CalendarDays />,
				label: "Public Meetings",
				linkProps: { to: "/meetings" },
			},
			{
				icon: <FileText />,
				label: "Public Notices",
				linkProps: { to: "/notices" },
			},
		],
		label: "Commission",
	},
];

export function CentralSidebar() {
	return <Layout.Sidebar.Nav groups={NAV_GROUPS} LinkComponent={Link} />;
}
