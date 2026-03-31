import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/service-requests")({
	component: RouteComponent,
	loader: async ({ context }) => {
		await context.db.zipCodes.preload();
		return { crumb: "Service Requests" };
	},
});

function RouteComponent() {
	return <Outlet />;
}
