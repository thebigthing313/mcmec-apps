import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/archive/")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="font-semibold text-2xl">Notices Archive Coming Soon</div>
	);
}
