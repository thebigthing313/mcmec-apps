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

export const Route = createFileRoute("/about")({
	component: AboutLayout,
});

const aboutLinks = [
	{ label: "Mission Statement", href: "/about/mission-statement" },
	{ label: "Leadership", href: "/about/leadership" },
];

function AboutLayout() {
	const location = useLocation();

	return (
		<SectionLayout
			sidebar={
				<SectionSidebar
					links={aboutLinks.map((link) => ({
						...link,
						isActive: location.pathname === link.href,
					}))}
					renderLink={(link, className) => (
						<Link className={className} to={link.href}>
							{link.label}
						</Link>
					)}
					title="About"
				/>
			}
		>
			<Outlet />
		</SectionLayout>
	);
}
