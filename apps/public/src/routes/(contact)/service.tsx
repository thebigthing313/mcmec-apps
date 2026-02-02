import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(contact)/service")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="mx-auto w-full max-w-7xl p-4">
			Hello "/(contact)/service"!
		</div>
	);
}
