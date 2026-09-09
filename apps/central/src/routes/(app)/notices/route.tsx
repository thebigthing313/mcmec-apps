import { createFileRoute, Outlet } from "@tanstack/react-router";
import { notices, noticeTypes } from "@/src/lib/db";

export const Route = createFileRoute("/(app)/notices")({
	component: RouteComponent,
	loader: async () => {
		await Promise.all([notices.preload(), noticeTypes.preload()]);
		return { crumb: "Public Notices" };
	},
});

function RouteComponent() {
	return <Outlet />;
}
