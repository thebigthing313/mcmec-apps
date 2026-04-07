import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
	"/mosquito-surveillance/mosquito-source-checklist",
)({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<article className="prose lg:prose-base max-w-none">
			<h1>Mosquito Source Checklist</h1>
			<p>This page is under construction. Please check back soon.</p>
		</article>
	);
}
