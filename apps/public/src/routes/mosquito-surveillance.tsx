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

export const Route = createFileRoute("/mosquito-surveillance")({
	component: MosquitoSurveillanceLayout,
});

const mosquitoSurveillanceLinks = [
	{
		label: "Weekly Mosquito Activity",
		href: "/mosquito-surveillance/weekly-activity",
	},
	{
		label: "Mosquito Source Checklist",
		href: "/mosquito-surveillance/mosquito-source-checklist",
	},
	{
		label: "Municipal Packet",
		href: "/mosquito-surveillance/municipal-packet",
	},
];

function MosquitoSurveillanceLayout() {
	const location = useLocation();

	return (
		<SectionLayout
			sidebar={
				<SectionSidebar
					links={mosquitoSurveillanceLinks.map((link) => ({
						...link,
						isActive: location.pathname === link.href,
					}))}
					renderLink={(link, className) => (
						<Link className={className} to={link.href}>
							{link.label}
						</Link>
					)}
					title="Mosquito Surveillance"
				/>
			}
		>
			<Outlet />
		</SectionLayout>
	);
}
