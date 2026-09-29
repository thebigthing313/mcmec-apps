import { Home, Users } from "lucide-react";
import type { ShellApp } from "@/src/lib/shell";

/**
 * HR as the shell sees it: the `/hr` layout route's `staticData`.
 *
 * It sits here beside the portal's rail rather than under `src/apps/hr/`, because `staticData` is
 * never code-split: the route tree carries it into the entry chunk, and `pnpm check-bundle`
 * refuses App code there. A rail is a few links and icons; the screens behind them stay lazy.
 *
 * Two destinations need no heading above them, so the group is unlabelled.
 */
export const HR_SHELL: ShellApp = {
	activeApp: "HR",
	sidebar: [
		{
			items: [
				{ icon: <Home />, label: "Dashboard", linkProps: { to: "/hr" } },
				{
					icon: <Users />,
					label: "Employees",
					linkProps: { to: "/hr/employees" },
				},
			],
		},
	],
};
