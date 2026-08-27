import type { LayoutNavGroup } from "@mcmec/ui/mcmec-layout";
import { Layout } from "@mcmec/ui/mcmec-layout";
import { Link } from "@tanstack/react-router";
import { Home, Users } from "lucide-react";

type NavLinkProps = { to: string };

/** Two destinations need no heading above them; an unlabeled group is the honest answer. */
const NAV_GROUPS: Array<LayoutNavGroup<NavLinkProps>> = [
	{
		items: [
			{ icon: <Home />, label: "Dashboard", linkProps: { to: "/" } },
			{
				icon: <Users />,
				label: "Manage Employees",
				linkProps: { to: "/employees" },
			},
		],
	},
];

export function HrSidebar() {
	return <Layout.Sidebar.Nav groups={NAV_GROUPS} LinkComponent={Link} />;
}
