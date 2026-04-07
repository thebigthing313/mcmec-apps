import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/mosquito-control/spray-notice")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<article className="prose lg:prose-base max-w-none">
			<h1>Public Notice for Adult Mosquito Control Treatment</h1>
			<p>
				In compliance with section 9.10 and 9.15 of the New Jersey Pesticide
				Control Code (N.J.A.C. Title 7, Chapter 30), the Middlesex County
				Mosquito Extermination Commission may be applying mosquito control
				products for the control of adult mosquito populations on an area-wide
				basis, as needed, throughout Middlesex County during the period of May
				1st through November 30th.
			</p>
			<p>
				The mosquito control products used will be those{" "}
				<a
					href="https://middlesexmosquito.sharepoint.com/:b:/g/IQAdHws6ZPl5TKbUfOi7KZeVAWhhhW6vCOHOhHqbNgJW5_I?e=l3TjE4"
					rel="noopener noreferrer"
					target="_blank"
				>
					recommended by the New Jersey Agricultural Experiment Station (NJAES),
					Rutgers University
				</a>{" "}
				for the control of adult mosquitoes which include:
			</p>
			<ul>
				<li>
					Malathion (Fyfanon® ULV, EPA Reg#67760-34) (
					<a
						href="https://middlesexmosquito.sharepoint.com/:b:/g/IQCAAHgu9bwtSJILsQLUPrE5AZl4XQ1wtcC8JiOnbpIIluo?e=1e5AmF"
						rel="noopener noreferrer"
						target="_blank"
					>
						Fact Sheet
					</a>
					)
				</li>
				<li>
					Etofenprox (Zenivex® E4 RTU, EPA Reg#2724-807; Zenivex® E20, EPA
					Reg#2724-791) (
					<a
						href="https://middlesexmosquito.sharepoint.com/:b:/g/IQA8WAM64HkzSYZ8dAej33eKAQFheJOEA3HntjhHQMKkLSE?e=gc2J92"
						rel="noopener noreferrer"
						target="_blank"
					>
						Fact Sheet
					</a>
					)
				</li>
				<li>
					Prallethrin - Sumithrin (Duet™ Dual-Action Adulticide, EPA
					Reg#1021-1795-8329) (
					<a
						href="https://middlesexmosquito.sharepoint.com/:b:/g/IQAGYFoWpJj2S7KH16-KTOzsARkyuLQu0PRDd0Ab-zylXbs?e=0iPEHS"
						rel="noopener noreferrer"
						target="_blank"
					>
						Fact Sheet
					</a>
					)
				</li>
				<li>
					Deltamethrin (DeltaGard® EPA, Reg#432-1534) (
					<a
						href="https://middlesexmosquito.sharepoint.com/:b:/g/IQAAsUz6I6tBTas8NDIz7MybAWOGmKjtQVSONRwe5mr5tDE?e=TIhjep"
						rel="noopener noreferrer"
						target="_blank"
					>
						Fact Sheet
					</a>
					)
				</li>
			</ul>
			<p>
				All applications will be according to product labeling. Products will be
				applied from the ground by truck or handheld equipment and/or by
				aircraft, all using low volume (LV) or ultra-low volume (ULV)
				techniques.
			</p>
			<p>
				For routine pesticide-related health inquiries, please contact the{" "}
				<a
					href="https://npic.orst.edu/"
					rel="noopener noreferrer"
					target="_blank"
				>
					National Pesticide Information Center
				</a>
				, at 1-800-858-7378. For information on pesticide regulations, pesticide
				complaints and health referrals, contact the New Jersey Pesticide
				Control Program at 609-984-6568. In the case of any pesticide emergency,
				please contact the{" "}
				<a
					href="https://www.njpies.org/"
					rel="noopener noreferrer"
					target="_blank"
				>
					New Jersey Poison Information and Education System
				</a>{" "}
				at 1-800-222-1222. For the most updated information on the time and
				location of adult mosquito control applications, please view the{" "}
				<Link to="/mosquito-control/spray-schedule">Spray Schedule</Link> page
				or call the Office at 732-549-0665. Upon request, the pesticide
				applicator (MCMEC) shall provide a resident with notification at least
				12-hours prior to the application, except for Quarantine and Disease
				Vector Control only, when conditions necessitate pesticide applications
				sooner than that time.
			</p>
			<p>
				Remember: Mosquito control is everyone's responsibility; please do your
				part by preventing mosquito production on your property. For more
				information on mosquitoes and mosquito control, contact the
				Superintendent (NJDEP CPA License #50245B), Middlesex County Mosquito
				Extermination Commission at 732-549-0665.
			</p>

			<h2>Precautions to Reduce Exposure</h2>
			<p>
				In order to reduce the number of nuisance and vector mosquitoes in the
				specified area(s), the following adult mosquito control products will be
				applied from the ground by truck or handheld equipment and/or by
				aircraft, all using low volume (LV) or ultra-low volume (ULV)
				techniques. Neither the USEPA nor the NJ Department of Environmental
				Protection (NJDEP) requires relocating or taking special precautions
				during spraying with this product. All applications will be made
				according to product labeling. However, to reduce exposure:
			</p>
			<ul>
				<li>
					Pay attention to notices about mosquito insecticide treatments found
					through newspapers, websites, automated telephone messages or notices
					distributed by municipal, county or state agencies.
				</li>
				<li>
					Plan your activities to limit time spent outside during times of
					possible insecticide treatments. Move your pets, their food, and water
					dishes inside during applications. Also bring clothing and children's
					toys inside. Stay back from application equipment, whether in use or
					not.
				</li>
				<li>
					Whenever possible, remain indoors with windows closed and with window
					air conditioners on non-vent (closed to the outside air) and window
					fans turned off during spraying.
				</li>
				<li>
					Avoid direct contact with surfaces that are still wet from pesticide
					spraying. Do not allow children to play in areas that have been
					sprayed until they have completely dried (approximately one hour).
				</li>
				<li>
					If you must remain outdoors, avoid eye and skin contact with the
					spray. If you get spray in your eyes or on your skin, immediately
					flush and rinse with water. If you believe that you have been exposed
					to pesticide spray and have health-related questions, contact your
					physician.
				</li>
			</ul>
		</article>
	);
}
