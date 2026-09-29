import { Home, Shield } from "lucide-react";
import type { ShellApp } from "@/src/lib/shell";

/**
 * Admin as the shell sees it: the `/admin` layout route's `staticData`. It lives outside
 * `src/apps/admin/` for the reason given in ./hr-sidebar.
 *
 * Admin holds only the Grant grid, "Users". Employees belong to HR (#238), so there is no
 * Employees item here and no link across to HR.
 */
export const ADMIN_SHELL: ShellApp = {
	activeApp: "Admin",
	sidebar: [
		{
			items: [
				{ icon: <Home />, label: "Dashboard", linkProps: { to: "/admin" } },
				{
					icon: <Shield />,
					label: "Users",
					linkProps: { to: "/admin/users" },
				},
			],
		},
	],
};
