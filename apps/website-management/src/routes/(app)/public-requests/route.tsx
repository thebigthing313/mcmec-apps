import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/public-requests")({
	component: RouteComponent,
	loader: async ({ context }) => {
		await Promise.all([
			context.db.publicRequests.preload(),
			context.db.zipCodes.preload(),
		]);
		return { crumb: "Public Requests" };
	},
});

function RouteComponent() {
	return <Outlet />;
}
