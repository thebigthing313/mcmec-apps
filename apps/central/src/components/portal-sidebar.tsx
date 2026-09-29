import { CalendarDays, FileText, Home } from "lucide-react";
import type { AppSidebar, ShellApp } from "@/src/lib/shell";

/**
 * The Self Service Portal's rail. The shell shows it on the portal's own routes, and in place of
 * an App's rail when that App refuses the User (the refusal keeps its URL, so the rail offers the
 * way back instead).
 *
 * "Commission" names the public record — what the Commission has published and what it has
 * called — as distinct from Dashboard, which is where you are rather than what you are reading.
 * The Dashboard group stays unlabelled, per DESIGN.md's rule that a label is not invented for a
 * lone destination.
 */
const PORTAL_SIDEBAR: AppSidebar = [
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

/**
 * The Self Service Portal as the shell sees it: the root signed-in layout's `staticData`, and the
 * shell's fallback wherever no App has taken over.
 */
export const PORTAL_SHELL: ShellApp = {
	activeApp: "Self Service Portal",
	sidebar: PORTAL_SIDEBAR,
};
