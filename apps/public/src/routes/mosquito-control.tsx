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

export const Route = createFileRoute("/mosquito-control")({
	component: MosquitoControlLayout,
});

const mosquitoControlLinks = [
	{
		label: "How We Control Mosquitoes",
		href: "/mosquito-control/how-we-control-mosquitoes",
	},
	{
		label: "Mosquito Control Products",
		href: "/mosquito-control/mosquito-control-products",
	},
	{ label: "Spray Schedule", href: "/mosquito-control/spray-schedule" },
	{ label: "Spray Notice", href: "/mosquito-control/spray-notice" },
	{
		label: "Aerial Larviciding Notice",
		href: "/mosquito-control/aerial-larviciding-notice",
	},
];

function MosquitoControlLayout() {
	const location = useLocation();

	return (
		<SectionLayout
			sidebar={
				<SectionSidebar
					links={mosquitoControlLinks.map((link) => ({
						...link,
						isActive: location.pathname === link.href,
					}))}
					renderLink={(link, className) => (
						<Link className={className} to={link.href}>
							{link.label}
						</Link>
					)}
					title="Mosquito Control"
				/>
			}
		>
			<Outlet />
		</SectionLayout>
	);
}
