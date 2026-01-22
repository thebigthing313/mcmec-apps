import { createFileRoute, Outlet } from "@tanstack/react-router";
import { meetings } from "@/src/lib/collections/meetings";

export const Route = createFileRoute("/(app)/meetings")({
	component: RouteComponent,
	loader: async () => {
		await meetings.preload();
		return { crumb: "Meetings" };
	},
});

function RouteComponent() {
	return <Outlet />;
}
