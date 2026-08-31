import { createFileRoute, Outlet } from "@tanstack/react-router";
import { notices, noticeTypes } from "@/src/lib/db";

export const Route = createFileRoute("/(app)/categories")({
	component: RouteComponent,
	// Notices come along because the count of what a category holds is the reason its Delete is
	// refused, and that count has to be on screen before the button rather than in the 409 after.
	loader: async () => {
		await Promise.all([noticeTypes.preload(), notices.preload()]);
		return { crumb: "Notice Categories" };
	},
});

function RouteComponent() {
	return <Outlet />;
}
