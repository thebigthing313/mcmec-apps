import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(about)/mosquito-control-products")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="mx-auto w-full max-w-7xl p-4">
			<article className="prose lg:prose-xl max-w-none">
				<h1>Commonly Used Mosquito Control Products</h1>
				<p>
					The Commission uses insecticides with low environmental risk for
					controlling mosquitoes. All insecticides used comply with state and
					federal requirements and are consistent with the recommendations
					provided by the New Jersey Agricultural Experiment Station, Rutgers
					University:{" "}
					<a
						href="https://vectorbio.rutgers.edu/outreach/docs/bmpmcnj.pdf"
						rel="noopener noreferrer"
						target="_blank"
					>
						"Insecticides Recommended For Mosquito Control in New Jersey in
						2012" publication #P-08001-01-12.
					</a>
				</p>
			</article>
		</div>
	);
}
