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
import type { ShellApp } from "@/src/lib/shell";

/**
 * Website Management as the shell sees it: the `/website-management` layout route's
 * `staticData`. It lives outside `src/apps/website-management/` for the reason given in
 * ./hr-sidebar — `staticData` ships in the entry chunk.
 *
 * The rail moved over from the retiring `website-management` app unchanged apart from its paths,
 * grouped by the work rather than listed flat: what gets published, what happens in the field,
 * what the public sends in, and the slow-changing lists the other three refer to. Each group
 * stays at four items or fewer, the number a reader can hold at once.
 */
export const WEBSITE_MANAGEMENT_SHELL: ShellApp = {
	activeApp: "Website Management",
	sidebar: [
		{
			items: [
				{
					icon: <Home />,
					label: "Dashboard",
					linkProps: { to: "/website-management" },
				},
			],
		},
		{
			items: [
				{
					icon: <BookOpen />,
					label: "Public Notices",
					linkProps: { to: "/website-management/notices" },
				},
				{
					icon: <Users />,
					label: "Meetings",
					linkProps: { to: "/website-management/meetings" },
				},
				{
					icon: <FileText />,
					label: "Documents",
					linkProps: { to: "/website-management/documents" },
				},
				{
					icon: <Briefcase />,
					label: "Job Postings",
					linkProps: { to: "/website-management/job-postings" },
				},
			],
			label: "Publishing",
		},
		{
			items: [
				{
					icon: <Calendar />,
					label: "Spray Missions",
					linkProps: { to: "/website-management/spray-missions" },
				},
				{
					icon: <SprayCan />,
					label: "Insecticides",
					linkProps: { to: "/website-management/insecticides" },
				},
				{
					icon: <BarChart3 />,
					label: "Weekly Mosquito Activity",
					linkProps: { to: "/website-management/weekly-activity" },
				},
			],
			label: "Operations",
		},
		{
			items: [
				{
					icon: <Inbox />,
					label: "Public Requests",
					linkProps: { to: "/website-management/public-requests" },
				},
			],
			label: "Intake",
		},
		{
			items: [
				{
					icon: <Group />,
					label: "Notice Categories",
					linkProps: { to: "/website-management/notice-categories" },
				},
				{
					icon: <FolderOpen />,
					label: "Document Categories",
					linkProps: { to: "/website-management/document-categories" },
				},
			],
			label: "Categories",
		},
	],
};
