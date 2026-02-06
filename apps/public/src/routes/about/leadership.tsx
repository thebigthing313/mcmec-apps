import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about/leadership")({
	component: RouteComponent,
});

type Commissioner = {
	name: string;
	title: string;
};
const commissioners: Commissioner[] = [
	{
		name: "Catherine Totin",
		title: "President",
	},
	{
		name: "John Grun",
		title: "Vice President",
	},
	{
		name: "Patrick Hanson",
		title: "Treasurer",
	},
	{
		name: "Robert Dreyer",
		title: "Assistant Treasurer",
	},
	{
		name: "Daniel Frankel",
		title: "Commissioner",
	},
	{
		name: "Dr. George Hamilton",
		title: "Commissioner",
	},
	{
		name: "Shanti Narra",
		title: "Middlesex County Commissioner Liaison",
	},
	{
		name: "Dr. Deepak Matadha",
		title: "Secretary/Superintendent",
	},
	{
		name: "Adrian Kabigting",
		title: "Recording Secretary/Commission Clerk",
	},
];

function RouteComponent() {
	return (
		<article className="prose lg:prose-xl max-w-none">
			<h1>Leadership</h1>
			<p>
				The Middlesex County Mosquito Extermination Commission (MCMEC) is led by
				a dedicated board of commissioners appointed by the Middlesex County
				Board of County Commissioners . Operating as a body politic in
				accordance with New Jersey State Law (N.J.S.A. 26:9-1 et seq.), the
				Commission is composed of six appointive members—at least three of whom
				possess experience in public health—alongside the Director of the State
				Experiment Station and the Commissioner of Health serving as ex-officio
				members.
			</p>
			<ul>
				{commissioners.map((commissioner) => (
					<li key={commissioner.name}>
						<strong>{commissioner.name}</strong>, {commissioner.title}
					</li>
				))}
			</ul>
			<p>
				<a
					href="https://sebs.rutgers.edu/njaes"
					rel="noopener noreferrer"
					target="_blank"
				>
					New Jersey Agricultural Experiment Station Website
				</a>
			</p>
			<p>
				<a
					href="https://www.nj.gov/health/"
					rel="noopener noreferrer"
					target="_blank"
				>
					New Jersey Department of Health Website
				</a>
			</p>
		</article>
	);
}
