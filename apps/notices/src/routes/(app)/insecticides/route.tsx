import { createFileRoute, Outlet } from "@tanstack/react-router";
import { insecticides } from "@/src/lib/collections/insecticides";

export const Route = createFileRoute("/(app)/insecticides")({
	component: RouteComponent,
	loader: async () => {
		await insecticides.preload();
		return { crumb: "Insecticides" };
	},
});

function RouteComponent() {
	return <Outlet />;
}
