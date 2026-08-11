import { createFileRoute, Outlet } from "@tanstack/react-router";
import {
	insecticides,
	municipalities,
	sprayScheduleMunicipalities,
	spraySchedules,
} from "@/src/lib/db";

export const Route = createFileRoute("/(app)/spray-schedule")({
	component: RouteComponent,
	// The schedule screens join across all four of these (see hooks/use-spray-schedules),
	// and a live query on a collection that never synced suspends forever.
	loader: async () => {
		await Promise.all([
			spraySchedules.preload(),
			insecticides.preload(),
			municipalities.preload(),
			sprayScheduleMunicipalities.preload(),
		]);
		return { crumb: "Spray Schedule" };
	},
});

function RouteComponent() {
	return <Outlet />;
}
