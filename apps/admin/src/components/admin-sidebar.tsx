import type { LayoutNavGroup } from "@mcmec/ui/mcmec-layout";
import { Layout } from "@mcmec/ui/mcmec-layout";
import { Link } from "@tanstack/react-router";
import { Home, Shield, Users } from "lucide-react";

type NavLinkProps = { to: string };

/** Three destinations need no heading above them; an unlabeled group is the honest answer. */
const NAV_GROUPS: Array<LayoutNavGroup<NavLinkProps>> = [
	{
		items: [
			{ icon: <Home />, label: "Dashboard", linkProps: { to: "/" } },
			{
				icon: <Users />,
				label: "Manage Employees",
				linkProps: { to: "/employees" },
			},
			{
				icon: <Shield />,
				label: "Manage Permissions",
				linkProps: { to: "/permissions" },
			},
		],
	},
];

export function AdminSidebar() {
	return <Layout.Sidebar.Nav groups={NAV_GROUPS} LinkComponent={Link} />;
}
