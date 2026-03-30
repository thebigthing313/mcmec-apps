import { createFileRoute, Outlet } from "@tanstack/react-router";
import { notices, noticeTypes } from "@/src/lib/db";

export const Route = createFileRoute("/(app)/notices")({
	component: RouteComponent,
	loader: async () => {
		await notices.preload();
		await noticeTypes.preload();
		return { crumb: "Notices" };
	},
});

function RouteComponent() {
	return <Outlet />;
}
