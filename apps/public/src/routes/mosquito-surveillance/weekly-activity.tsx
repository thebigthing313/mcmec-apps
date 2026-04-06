import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/mosquito-surveillance/weekly-activity")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<article className="prose lg:prose-xl max-w-none">
			<h1>Weekly Mosquito Activity</h1>
			<p>This page is under construction. Please check back soon.</p>
		</article>
	);
}
