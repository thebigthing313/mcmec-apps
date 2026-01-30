import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(about)/mission")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="mx-auto w-full max-w-7xl p-4">
			<article className="prose lg:prose-xl">
				<h1>Mission Statement</h1>
				<p>
					The Middlesex County Mosquito Extermination Commission (MCMEC) was
					created in 1914. In accordance with the laws of the State of New
					Jersey, N.J.S.A, Title 26, Chapter 9 and 26:3-46 et. seq., the
					Commission is "to perform all acts which, in its opinion, may be
					necessary for the elimination of mosquito breeding areas, or which
					will tend to exterminate mosquitoes within the county."
				</p>
				<h2>What We Do:</h2>
				<ul>
					<li>
						Minimize the nuisance levels caused by mosquitoes on the citizens
						and visitors of Middlesex County.
					</li>
					<li>
						Protect them from the threat of mosquito-borne diseases such as West
						Nile virus (WNV).
					</li>
				</ul>
			</article>
		</div>
	);
}
