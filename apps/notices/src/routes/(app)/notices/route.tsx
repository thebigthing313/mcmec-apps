import { createFileRoute, Outlet } from "@tanstack/react-router";
import { notice_types } from "@/src/lib/collections/notice_types";
import { notices } from "@/src/lib/collections/notices";

export const Route = createFileRoute("/(app)/notices")({
	component: RouteComponent,
	loader: async () => {
		await notices.preload();
		await notice_types.preload();
		return { crumb: "Notices" };
	},
});

function RouteComponent() {
	return <Outlet />;
}
