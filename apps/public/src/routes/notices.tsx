import {
	SectionLayout,
	SectionSidebar,
} from "@mcmec/ui/components/section-sidebar";
import {
	createFileRoute,
	Link,
	Outlet,
	useLocation,
} from "@tanstack/react-router";

export const Route = createFileRoute("/notices")({
	component: NoticesLayout,
});

const noticesLinks = [
	{ label: "Legal Notices", href: "/notices" },
	{ label: "Public Meetings", href: "/notices/meetings" },
	{ label: "Archived Notices", href: "/notices/archive" },
	{ label: "Transparency", href: "/notices/transparency" },
];

function NoticesLayout() {
	const location = useLocation();

	return (
		<SectionLayout
			sidebar={
				<SectionSidebar
					links={noticesLinks.map((link) => ({
						...link,
						isActive: location.pathname === link.href,
					}))}
					renderLink={(link, className) => (
						<Link className={className} to={link.href}>
							{link.label}
						</Link>
					)}
					title="Public Notices"
				/>
			}
		>
			<Outlet />
		</SectionLayout>
	);
}
