import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about/mission")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="mx-auto w-full max-w-7xl p-4">
			<article className="prose lg:prose-xl max-w-none">
				<h1>Mission Statement</h1>
				<p>
					<img
						alt="MCMEC Building"
						className="w-full rounded-sm drop-shadow-accent drop-shadow-xl md:float-right md:ml-6 md:w-1/2"
						src="/building.webp"
					/>
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
				<p>
					The Commission recognizes mosquito-borne diseases to be hazardous to
					the health and safety of the people of Middlesex County and is
					committed to reducing the chance of infection through a comprehensive
					approach to mosquito control. This approach in in accordance with
					scientifically based best management practices and includes mosquito
					surveillance, water management, biological control, chemical control
					and public education.
				</p>
			</article>
		</div>
	);
}
