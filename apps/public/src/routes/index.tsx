import { createFileRoute, Link } from "@tanstack/react-router";
import {
	Activity,
	CalendarDays,
	ConciergeBell,
	Droplets,
	Newspaper,
	Users,
} from "lucide-react";
import type { CSSProperties } from "react";
import { CurrentRecord } from "../components/current-record";
import { HeroCarousel } from "../components/hero-carousel";
import {
	meetingsQueryOptions,
	noticesQueryOptions,
	spraySchedulesQueryOptions,
} from "../lib/queries";
import { canonical, seo } from "../lib/seo";

export const Route = createFileRoute("/")({
	component: RouteComponent,
	head: () => ({
		meta: seo({
			title: "MCMEC - Middlesex County Mosquito Extermination Commission",
			description:
				"Protecting Middlesex County, NJ from mosquitoes and mosquito-borne diseases since 1914. Submit a service request, view spray schedules, and access public notices.",
			url: "/",
		}),
		links: [canonical("/")],
	}),
	/*
	 * Prefetched, capped, and never awaited to completion.
	 *
	 * Every other route that carries the record blocks on the api, and when the api is slow or
	 * down those pages hang indefinitely. The home page is the one page that cannot afford
	 * that: it is where a resident lands from a mailer or a search result, and a hero that
	 * never paints is far worse than a record strip that fills in a moment later on the
	 * client. `prefetchQuery` does not throw, so a refusal degrades the strip to its stated
	 * empty sentences rather than the page to an error.
	 */
	loader: async ({ context }) => {
		let release: ReturnType<typeof setTimeout> | undefined;
		const budget = new Promise((resolve) => {
			release = setTimeout(resolve, RECORD_BUDGET_MS);
		});

		await Promise.race([
			Promise.allSettled([
				context.queryClient.prefetchQuery(spraySchedulesQueryOptions()),
				context.queryClient.prefetchQuery(noticesQueryOptions()),
				context.queryClient.prefetchQuery(meetingsQueryOptions()),
			]),
			budget,
		]);

		clearTimeout(release);
	},
});

/** How long the front door will wait on the record before rendering without it. */
const RECORD_BUDGET_MS = 2500;

const organizationJsonLd = JSON.stringify({
	"@context": "https://schema.org",
	"@type": "GovernmentOrganization",
	name: "Middlesex County Mosquito Extermination Commission",
	alternateName: "MCMEC",
	url: "https://middlesexmosquito.org",
	telephone: "+1-732-549-0665",
	faxNumber: "+1-732-603-0280",
	address: {
		"@type": "PostalAddress",
		streetAddress: "200 Parsonage Road",
		addressLocality: "Edison",
		addressRegion: "NJ",
		postalCode: "08837",
		addressCountry: "US",
	},
	areaServed: {
		"@type": "AdministrativeArea",
		name: "Middlesex County, New Jersey",
	},
});

/**
 * The six destinations, in the order the Commission ranked them. They are set at one weight:
 * the first two answer the questions a resident most often arrives with, and ordering says so
 * on its own. A size hierarchy on top of the ordering said it twice.
 *
 * They are one register rather than six cards: a single bordered container whose cells sit on
 * a 1px gap over a Rule-coloured ground, which is the Signal Band's construction from
 * `packages/ui`. It draws every divider at once and holds them exact when the cells wrap.
 */
interface Destination {
	title: string;
	description: string;
	icon: typeof ConciergeBell;
	href: string;
	/** Set when `href` leaves the site, so the cell renders an anchor rather than a Link. */
	external?: boolean;
}

const destinations: Destination[] = [
	{
		description:
			"Report a mosquito problem, request a property inspection or order mosquitofish.",
		href: "/contact/service-request",
		icon: ConciergeBell,
		title: "Request Service",
	},
	{
		description: "View upcoming mosquito spray treatments by municipality.",
		href: "/mosquito-control/spray-schedule",
		icon: CalendarDays,
		title: "Spray Schedule",
	},
	{
		description:
			"View current activity of common mosquito groups in the County.",
		href: "/mosquito-surveillance/weekly-activity",
		icon: Activity,
		title: "Mosquito Activity",
	},
	{
		description: "Review legal notices, announcements and public reports.",
		href: "/notices",
		icon: Newspaper,
		title: "Public Notices",
	},
	{
		description:
			"Learn how to remove mosquito habitats, apply repellents, and prevent mosquito bites.",
		external: true,
		href: "https://middlesexmosquito.sharepoint.com/:b:/g/IQCLzJFwXLQLSaGsaq3XvsZeASTGdz9VT-S_B3wdzNFA8Yc?e=0McKcA",
		icon: Droplets,
		title: "Prevention At Home",
	},
	{
		description:
			"Access Commission meeting schedules, agendas, and public record minutes.",
		href: "/notices/meetings",
		icon: Users,
		title: "Public Meetings",
	},
];

function RouteComponent() {
	return (
		/*
		 * `--band-inset` is one symmetric gutter, shared by the left half and the record strip
		 * below it, so everything in the band starts on the same vertical line.
		 *
		 * It replaces an inset pinned to the site's `max-w-7xl` measure, which was wrong here
		 * for a reason worth keeping: the split sits at `50vw`, and `(100vw - 80rem)/2 + 40rem`
		 * *is* `50vw`. Pinning content to the 7xl grid therefore gave the left half exactly the
		 * left half of a 1280px box — 640px of register inside a 953px column at 1920, and 640
		 * inside 1280 at 2560 — while the photograph filled 100% of its own half at every width.
		 * The halves were visibly unequal, and got more unequal the wider the display.
		 *
		 * A gutter that scales with the viewport keeps both halves full and both edges even.
		 * The reading measure is still capped, just not by this: the heading balances and the
		 * standfirst holds `46ch`, which is where the "don't grow a column with the display"
		 * rule actually belongs.
		 *
		 * `-my-8` cancels the shell's `main` margin so the band meets the navigation above it
		 * and the footer below with no Paper gap. A hero that floats in the page is a section;
		 * one that touches both edges is a band.
		 */
		<section
			/*
			 * The band owns the fold, exactly. `10rem` is the masthead: a `h-26` (104px) identity
			 * rail over a `h-14` (56px) nav tier, both fixed so this arithmetic stays true. What
			 * is left is spent on the hero and the record strip, so a visitor landing here sees
			 * the identity, the navigation, the photograph and the published record without
			 * scrolling — and the footer sits below the fold rather than intruding on it.
			 *
			 * `h-`, not `min-h-`: the point is that the four bands total one viewport. A minimum
			 * would let a tall display grow the band past the fold again.
			 */
			className="-my-8 flex w-full flex-col xl:h-[calc(100svh-10rem)]"
			style={{ "--band-inset": "clamp(1.5rem, 5vw, 7rem)" } as CSSProperties}
		>
			<script
				// biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD structured data
				dangerouslySetInnerHTML={{ __html: organizationJsonLd }}
				type="application/ld+json"
			/>

			{/*
			 * No gap between the halves, and no radius on either. The two grounds meet at a
			 * single hairline seam and each runs to its own viewport edge, which is what makes
			 * this one band rather than two panels that happen to be adjacent.
			 *
			 * The split waits for `xl`, not `lg`. Each half needs roughly 640px to hold a
			 * two-column register or a photograph worth looking at; splitting a 1024px display
			 * gives them 512px each, the register drops to one column, and the band grows to
			 * about 1200px tall with a photograph stretched into a slot beside it.
			 *
			 * The plate is last in the DOM and rightmost on a wide screen, so reading order and
			 * tab order are the same order in both layouts: the heading, then the destinations,
			 * then the photographs. Below `lg` that also puts the six answers above the imagery,
			 * which is the right way round for someone who arrived with one urgent question.
			 */}
			{/*
			 * The page still needs an `h1`, and it no longer has a visible one: the Commission's
			 * name moved into the masthead, where it is a site-wide identity block rather than
			 * this page's heading. A document with no `h1` gives a screen-reader user nothing to
			 * jump to and hands search engines no title for the site's most important route, so
			 * the heading stays and only its rendering goes.
			 */}
			<h1 className="sr-only">
				Middlesex County Mosquito Extermination Commission
			</h1>

			<div className="grid min-h-0 flex-1 items-stretch xl:grid-cols-[1fr_2fr]">
				<div className="flex min-h-0 flex-col justify-center gap-3 border-b bg-muted px-[var(--band-inset)] py-6 xl:border-r xl:border-b-0">
					{/*
					 * A container query, not a viewport one. The register's width is now half the
					 * page rather than all of it, so `sm:grid-cols-2` would put two columns in a
					 * 448px panel at exactly the width the layout splits — the panel has to be
					 * asked about itself.
					 */}
					<div className="flex min-h-0 flex-col">
						{/*
						 * Visible rather than `sr-only`: the register had a heading for screen readers
						 * only, so sighted visitors met six unlabelled cells. Sentence case, not the
						 * uppercase eyebrow the Current Record's column headings take — the Uppercase
						 * Is Structural Rule keeps caps off a heading read for content.
						 */}
						<h2 className="mb-2 font-semibold text-foreground text-lg">
							Resident Services & Information
						</h2>
						{/*
						 * One column, not two. The register is a third of the band now rather than a
						 * half, and six two-column cells in that width would set a 20ch measure. A
						 * single stack also lets each destination read as a row — icon, name, and the
						 * line that tells a resident which of six is theirs — which is the shape that
						 * survives being squeezed vertically to fit the fold.
						 *
						 * Two columns between `sm` and `xl`. The single stack is right when this is a
						 * third of the band beside the photograph; on a tablet it is the full width of
						 * the page, and six rows of one card each leave most of that width empty.
						 *
						 * Six separate cards rather than one divided register: each destination
						 * owns its own edge, so the six read as six choices rather than as rows of
						 * a list to be worked through in order.
						 */}
						<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:flex xl:min-h-0 xl:flex-col xl:overflow-y-auto">
							{destinations.map((destination) => (
								<DestinationCell
									destination={destination}
									key={destination.href}
								/>
							))}
						</div>
					</div>
				</div>

				<HeroCarousel />
			</div>

			<CurrentRecord />
		</section>
	);
}

// `relative` and the raised z on focus keep the 3px ring above the neighbouring
// card: the 8px gap does not cover a ring drawn outside the border box.
//
// `flex-1` over a `basis-0`: every card takes the same share of the register whatever
// its description runs to, so the six read as one set of equal choices rather than as
// a ranking by how much there was to say. The `min-h` is the floor a two-line
// description needs; below it the register scrolls rather than crushing the type.
const destinationCellClassName =
	"group relative flex min-h-[4.75rem] flex-1 items-center gap-3.5 rounded-lg border bg-card px-4 py-2.5 transition-colors hover:bg-secondary focus-visible:z-10 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring";

function DestinationCell({ destination }: { destination: Destination }) {
	const Icon = destination.icon;

	const body = (
		<>
			<Icon
				aria-hidden="true"
				className="size-6 shrink-0 text-primary"
				strokeWidth={1.75}
			/>
			<span className="flex min-w-0 flex-col gap-0.5">
				{/*
				 * Caps come from `uppercase`, not from the strings in `destinations`. The DOM text
				 * stays "Request Service", so the accessible name is a phrase rather than a run of
				 * capitals some screen readers spell letter by letter, and the words still match
				 * what the destination page calls itself. Caps also close up without added
				 * tracking, hence `tracking-wide`.
				 */}
				<span className="font-semibold text-base text-foreground uppercase tracking-wide">
					{destination.title}
				</span>
				<span className="text-[0.9375rem] text-muted-foreground leading-snug">
					{destination.description}
				</span>
			</span>
		</>
	);

	// An off-site destination cannot go through `Link` — the router would try to match the
	// SharePoint URL against the route tree. `target="_blank"` because it is a PDF held on
	// another origin, and the visitor should keep their place on the front door.
	if (destination.external) {
		return (
			<a
				className={destinationCellClassName}
				href={destination.href}
				rel="noopener noreferrer"
				target="_blank"
			>
				{body}
			</a>
		);
	}

	return (
		<Link className={destinationCellClassName} to={destination.href}>
			{body}
		</Link>
	);
}
