import { createFileRoute, Link } from "@tanstack/react-router";
import { canonical, seo } from "@/src/lib/seo";

export const Route = createFileRoute("/mosquito-control/spray-notice")({
	component: RouteComponent,
	head: () => ({
		meta: seo({
			title: "Spray Notice - MCMEC",
			description:
				"Public notice regarding mosquito spraying operations in Middlesex County, NJ. View products used and what residents can do during or after spraying.",
			url: "/mosquito-control/spray-notice",
		}),
		links: [canonical("/mosquito-control/spray-notice")],
	}),
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

			<h2>What Residents Can Do During or After Spraying</h2>
			<p>
				<strong>Please Note:</strong> Truck spraying for mosquito control is
				safe. The public health insecticides used do not pose a risk of harm to
				people, pets, animals, or the environment when applied according to
				label instructions, and they break down quickly without leaving lasting
				residue.
			</p>
			<p>To maximize your comfort, you can follow these simple steps:</p>
			<ul>
				<li>
					<strong>Check Schedules:</strong> Look out for local spray schedules
					by regularly checking the{" "}
					<Link to="/mosquito-control/spray-schedule">
						County Mosquito Commission website
					</Link>
					, municipal social media pages, local newspapers, local health
					offices, or via automated phone notifications.
				</li>
				<li>
					<strong>Maintain Distance:</strong> Always keep a safe distance from
					the spray truck and active application equipment.
				</li>
				<li>
					<strong>Stay Indoors If Preferred:</strong> You do not need to leave
					the area. If you prefer, you can stay inside with windows and doors
					closed for 15 to 30 minutes while the truck passes, though it is not
					necessary.
				</li>
				<li>
					<strong>Protect Pets &amp; Items:</strong> The spray does not harm
					animals, but you may bring pets, food, and water bowls inside for
					peace of mind. Wash any uncovered outdoor toys or pet dishes before
					reusing. Local beekeepers may also choose to cover hives loosely with
					a wet cloth or burlap.
				</li>
				<li>
					<strong>Rinse Produce:</strong> Thoroughly wash all harvested backyard
					fruits and vegetables before eating. You can also cover garden beds
					with a light sheet during the scheduled spray window.
				</li>
				<li>
					<strong>Consult Professionals:</strong> Consult your doctor or
					healthcare provider if you believe you are experiencing health effects
					from the spraying, especially due to known chemical sensitivities or a
					pre-existing respiratory issue.
				</li>
			</ul>
		</article>
	);
}
