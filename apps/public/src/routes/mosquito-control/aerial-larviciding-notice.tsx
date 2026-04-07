import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
	"/mosquito-control/aerial-larviciding-notice",
)({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<article className="prose lg:prose-base max-w-none">
			<h1>Aerial Larviciding Notice</h1>
			<p>This page is under construction. Please check back soon.</p>
		</article>
	);
}
