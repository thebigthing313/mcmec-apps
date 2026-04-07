import { createFileRoute, Link } from "@tanstack/react-router";
import { canonical, seo } from "@/src/lib/seo";

export const Route = createFileRoute(
	"/mosquito-surveillance/mosquito-source-checklist",
)({
	component: RouteComponent,
	head: () => ({
		meta: seo({
			title: "Mosquito Source Checklist - MCMEC",
			description:
				"Checklist for identifying and eliminating mosquito breeding sources around your property.",
			url: "/mosquito-surveillance/mosquito-source-checklist",
		}),
		links: [canonical("/mosquito-surveillance/mosquito-source-checklist")],
	}),
});

function RouteComponent() {
	return (
		<article className="prose lg:prose-base max-w-none">
			<h1>Mosquito Habitat Elimination Checklist</h1>
			<p>
				For a printable version of this checklist, please{" "}
				<a
					href="https://middlesexmosquito.sharepoint.com/:b:/g/IQDU2lPjFJT1R5BYNaun8_pbAYrJW9530Xww9vCkTIyQ68Y?e=VtogKz"
					rel="noopener noreferrer"
					target="_blank"
				>
					click here
				</a>
				.
			</p>
			<p>
				Use this checklist to find and get rid of all the standing water around
				your home where immature mosquitoes may live.
			</p>
			<p>
				Immature mosquitoes live and grow in standing water. It takes them about
				7 days to grow and become adult mosquitoes that are ready to fly and
				bite.
			</p>

			<h2>Common Household Items</h2>
			<ul>
				<li>
					<strong>Buckets:</strong> Empty water from buckets and turn them over.
				</li>
				<li>
					<strong>Garbage cans and recycling bins:</strong> Drill drainage holes
					in the bottoms of garbage cans and bins, keep covered and dispose of
					recycling weekly if possible.
				</li>
				<li>
					<strong>Tarps, plastic bags and sheets:</strong> Keep tarps tight and
					refit them if water collects.
				</li>
			</ul>

			<h2>Building Structures</h2>
			<ul>
				<li>
					<strong>Gutters:</strong> Keep gutters clean and properly pitched.
				</li>
				<li>
					<strong>Flexible downspout extensions:</strong> Pitch downspout
					extensions so water drains completely after it rains or replace them
					with a metal, non-flexible extension that is pitched to drain fully.
					Keep the inside free of debris.
				</li>
				<li>
					<strong>Leaky hose spigots:</strong> Fix leak or have it fixed by a
					professional plumber.
				</li>
			</ul>

			<h2>Around the Garden</h2>
			<ul>
				<li>
					<strong>Planter saucers:</strong> Dump the water out every 5-7 days or
					don't use a saucer at all.
				</li>
				<li>
					<strong>Planters without drainage holes:</strong> Drill holes in the
					bottom of your planter – it's healthier for your plants.
				</li>
				<li>
					<strong>Self-watering planters:</strong> Tightly seal the watering
					hole after adding water or use traditional planters with drainage
					holes.
				</li>
				<li>
					<strong>Wheelbarrows:</strong> Turn wheelbarrows over or store them on
					end.
				</li>
				<li>
					<strong>Watering Cans:</strong> Empty and store upside down or in a
					garage or shed.
				</li>
				<li>
					<strong>Rain Barrels:</strong> Cover tops of rain barrels and any
					overflow holes with tightly fitted screen.
				</li>
				<li>
					<strong>Bird Baths:</strong> Change water at least once a week and
					brush the inside of the bowl to remove any mosquito eggs.
				</li>
				<li>
					<strong>Ornamental ponds:</strong> Get fish. If that is not an option,
					you can get a pond fountain to stop the water from being stagnant.
				</li>
			</ul>

			<h2>Children's Toys</h2>
			<ul>
				<li>
					<strong>Portable basketball hoops:</strong> Make sure caps for fill
					holes are in place; replace if lost.
				</li>
				<li>
					<strong>Kiddie pools:</strong> Empty or change water in kiddie pools
					every 5 - 7 days. Be sure to store indoors or turned over when empty.
				</li>
				<li>
					<strong>Sand boxes:</strong> Drill small drainage holes in the bottom
					of your sand box.
				</li>
				<li>
					<strong>Big plastic toys, wagons, etc.:</strong> Keep toys turned over
					or inside when not in use. If water can get inside the toy, so can a
					mosquito - drill drainage holes in the bottom.
				</li>
			</ul>

			<h2>Recreation</h2>
			<ul>
				<li>
					<strong>Boats:</strong> Empty all the water possible. Cover boats in
					storage with tight tarps or use boat shrink wrap.
				</li>
				<li>
					<strong>Jet skis:</strong> Rinse out the foot depressions with a hose
					every week. Jet skis can be tightly tarped or stored indoors.
				</li>
				<li>
					<strong>Pools/pool covers:</strong> Keep the top of pool covers free
					of standing water. If you know of an abandoned home in your
					neighborhood with an unkempt pool, call the Middlesex County Mosquito
					Extermination Commission. It may need to be treated or stocked with
					fish that eat immature mosquitoes.
				</li>
			</ul>

			<p>
				<strong>
					Don't forget to check behind sheds, under shrubs, decks & porches
					where containers may hide.
				</strong>
			</p>
			<p>
				Still have a mosquito problem? You can complete a{" "}
				<Link to="/contact/service-request">service request here</Link>.
			</p>
		</article>
	);
}
