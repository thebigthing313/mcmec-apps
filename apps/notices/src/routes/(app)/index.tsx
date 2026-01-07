import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/")({
	component: RouteComponent,
	loader: () => {
		return { crumb: "Dashboard" };
	},
});

function RouteComponent() {
	return <div>Hello "/(app)/"!</div>;
}
