import { createFileRoute, Link } from "@tanstack/react-router";
import { canonical, seo } from "@/src/lib/seo";

export const Route = createFileRoute("/mosquito-surveillance/municipal-packet")(
	{
		component: RouteComponent,
		head: () => ({
			meta: seo({
				title: "Municipal Packet - MCMEC",
				description:
					"Municipal mosquito control information packet for Middlesex County municipalities.",
				url: "/mosquito-surveillance/municipal-packet",
			}),
			links: [canonical("/mosquito-surveillance/municipal-packet")],
		}),
	},
);

function RouteComponent() {
	return (
		<article className="prose lg:prose-base max-w-none">
			<h1>Municipal Packet</h1>
			<p>
				To download the full municipal packet, please{" "}
				<a
					href="https://middlesexmosquito.sharepoint.com/:b:/g/IQCe8xh5JPY8Qq8IkjwOeUexAd_w-bydOC6LidG5qjFnadE?e=6Rx4bu"
					rel="noopener noreferrer"
					target="_blank"
				>
					click here
				</a>
				.
			</p>
			<p>
				Enclosed you will find New Jersey Department of Environmental Protection
				Agency approved information about the Middlesex County Mosquito
				Extermination Commission's operations. This information is provided to
				be in compliance with N.J.A.C. 7:30-9.10e.
			</p>
			<p>This packet contains the following enclosures:</p>
			<ol>
				<li>
					A question and answer sheet on "Mosquitoes – What Everyone Should
					Know"
				</li>
				<li>
					Fact sheets on{" "}
					<a
						href="https://middlesexmosquito.sharepoint.com/:b:/g/IQAAsUz6I6tBTas8NDIz7MybAWOGmKjtQVSONRwe5mr5tDE?e=TIhjep"
						rel="noopener noreferrer"
						target="_blank"
					>
						DeltaGard®
					</a>
					,{" "}
					<a
						href="https://middlesexmosquito.sharepoint.com/:b:/g/IQAGYFoWpJj2S7KH16-KTOzsARkyuLQu0PRDd0Ab-zylXbs?e=0iPEHS"
						rel="noopener noreferrer"
						target="_blank"
					>
						Duet®
					</a>
					,{" "}
					<a
						href="https://middlesexmosquito.sharepoint.com/:b:/g/IQCAAHgu9bwtSJILsQLUPrE5AZl4XQ1wtcC8JiOnbpIIluo?e=1e5AmF"
						rel="noopener noreferrer"
						target="_blank"
					>
						Fyfanon®
					</a>
					, and{" "}
					<a
						href="https://middlesexmosquito.sharepoint.com/:b:/g/IQA8WAM64HkzSYZ8dAej33eKAQFheJOEA3HntjhHQMKkLSE?e=gc2J92"
						rel="noopener noreferrer"
						target="_blank"
					>
						Zenivex®
					</a>{" "}
					Adulticides – the{" "}
					<Link to="/mosquito-control/mosquito-control-products">
						mosquito control products
					</Link>{" "}
					that may be used by the Commission to control the disease incidence
					and nuisance levels caused by adult mosquitoes.
				</li>
				<li>
					An example of the{" "}
					<Link to="/mosquito-control/spray-notice">
						"Public Notice for Adult Mosquito Control Treatment"
					</Link>{" "}
					which will appear in local papers during the mosquito season.
				</li>
				<li>
					<a
						href="https://middlesexmosquito.sharepoint.com/:b:/g/IQCLzJFwXLQLSaGsaq3XvsZeAUmMrM-lZmc8Bg5lBTX4MIE?e=LJshK5"
						rel="noopener noreferrer"
						target="_blank"
					>
						Mosquito Prevention and Protection – Fact Sheet
					</a>
				</li>
				<li>
					<Link to="/mosquito-surveillance/mosquito-source-checklist">
						Mosquito Habitat Elimination Checklist
					</Link>
				</li>
			</ol>
			<p>
				Pursuant to N.J.A.C. 7:30-9.10(e) 2iii, "Municipalities are encouraged
				to share this information with all residents in their community."
			</p>
			<p>
				If desired, you may contact the Commission to arrange for a speaker to
				talk about mosquito control in your municipality.
			</p>
			<p>
				The information provided in this packet, our{" "}
				<Link to="/contact/service-request">Request for Service form</Link> for
				Middlesex County residents, and more is all available on this website.
			</p>
		</article>
	);
}
