import type { LayoutNavGroup } from "@mcmec/ui/mcmec-layout";
import { Layout } from "@mcmec/ui/mcmec-layout";
import { Link } from "@tanstack/react-router";
import {
	BarChart3,
	BookOpen,
	Briefcase,
	Calendar,
	FileText,
	FolderOpen,
	Group,
	Home,
	Inbox,
	SprayCan,
	Users,
} from "lucide-react";

type NavLinkProps = { to: string };

/**
 * Website Management's rail, grouped by the work rather than listed flat.
 *
 * Eleven destinations under a single heading reading "Menu" is not an information architecture;
 * it is the absence of one, and it fails hardest exactly when it matters most — someone opening
 * a seasonal screen for the first time in months has to read all eleven to find the one. The
 * groups below are the Commission's own division of the work: what gets published, what happens
 * in the field, what the public sends in, and the slow-changing lists the other three refer to.
 *
 * Each group stays at four items or fewer, which is the number a reader can hold at once.
 */
const NAV_GROUPS: Array<LayoutNavGroup<NavLinkProps>> = [
	{
		items: [{ icon: <Home />, label: "Dashboard", linkProps: { to: "/" } }],
	},
	{
		items: [
			{
				icon: <BookOpen />,
				label: "Public Notices",
				linkProps: { to: "/notices" },
			},
			{ icon: <Users />, label: "Meetings", linkProps: { to: "/meetings" } },
			{
				icon: <FileText />,
				label: "Documents",
				linkProps: { to: "/documents" },
			},
			{
				icon: <Briefcase />,
				label: "Job Postings",
				linkProps: { to: "/job-postings" },
			},
		],
		label: "Publishing",
	},
	{
		items: [
			{
				icon: <Calendar />,
				label: "Spray Missions",
				linkProps: { to: "/spray-schedule" },
			},
			{
				icon: <SprayCan />,
				label: "Insecticides",
				linkProps: { to: "/insecticides" },
			},
			{
				icon: <BarChart3 />,
				label: "Weekly Mosquito Activity",
				linkProps: { to: "/weekly-activity" },
			},
		],
		label: "Operations",
	},
	{
		items: [
			{
				icon: <Inbox />,
				label: "Public Requests",
				linkProps: { to: "/public-requests" },
			},
		],
		label: "Intake",
	},
	{
		items: [
			{
				icon: <Group />,
				label: "Notice Categories",
				linkProps: { to: "/categories" },
			},
			{
				icon: <FolderOpen />,
				label: "Document Categories",
				linkProps: { to: "/document-categories" },
			},
		],
		label: "Categories",
	},
];

export function AppSidebar() {
	return <Layout.Sidebar.Nav groups={NAV_GROUPS} LinkComponent={Link} />;
}
