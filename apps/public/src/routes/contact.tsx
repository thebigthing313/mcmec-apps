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

export const Route = createFileRoute("/contact")({
	component: ContactLayout,
});

const contactLinks = [
	{ label: "Service Requests", href: "/contact/service-request" },
	{ label: "Contact Us", href: "/contact/contact-us" },
];

function ContactLayout() {
	const location = useLocation();

	return (
		<SectionLayout
			sidebar={
				<SectionSidebar
					links={contactLinks.map((link) => ({
						...link,
						isActive: location.pathname === link.href,
					}))}
					renderLink={(link, className) => (
						<Link className={className} to={link.href}>
							{link.label}
						</Link>
					)}
					title="Contact"
				/>
			}
		>
			<Outlet />
		</SectionLayout>
	);
}
