import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/contact-submissions")({
	component: RouteComponent,
	loader: () => {
		return { crumb: "Contact Submissions" };
	},
});

function RouteComponent() {
	return <Outlet />;
}
