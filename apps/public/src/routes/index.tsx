import { cn } from "@mcmec/ui/lib/utils";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	Activity,
	ArrowRight,
	CalendarDays,
	ConciergeBell,
	Droplets,
	Newspaper,
	Users,
} from "lucide-react";
import type { CSSProperties } from "react";
import { HeroCarousel } from "../components/hero-carousel";
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
});

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
 * The six destinations, in the order the Commission ranked them. The first two lead because
 * they are the two urgent questions a resident arrives with — get something dealt with, and
 * find out whether their street is being treated; the rest follow at a compact weight.
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
}

const leadDestinations: Destination[] = [
	{
		description:
			"Report a mosquito problem, a water management issue, or request mosquitofish.",
		href: "/contact/service-request",
		icon: ConciergeBell,
		title: "Request Service",
	},
	{
		description: "Upcoming Spray Missions, by municipality and date.",
		href: "/mosquito-control/spray-schedule",
		icon: CalendarDays,
		title: "Spray Schedule",
	},
];

const furtherDestinations: Destination[] = [
	{
		description: "Weekly mosquito activity reports for the county.",
		href: "/mosquito-surveillance/weekly-activity",
		icon: Activity,
		title: "Weekly Mosquito Activity",
	},
	{
		description: "Legal notices that are still currently in effect.",
		href: "/notices",
		icon: Newspaper,
		title: "Public Notices",
	},
	{
		description: "Find and empty the standing water around your property.",
		href: "/mosquito-surveillance/mosquito-source-checklist",
		icon: Droplets,
		title: "Prevention at Home",
	},
	{
		description: "Meeting schedules, agendas, and minutes.",
		href: "/notices/meetings",
		icon: Users,
		title: "Public Meetings",
	},
];

function RouteComponent() {
	return (
		/*
		 * `--bleed` is the inset that keeps the left half's *content* on the site's `max-w-7xl`
		 * measure while its *ground* runs to the viewport edge. DESIGN.md's rule survives the
		 * full-bleed band intact: the frame reaches the edge because it is the edge of the page,
		 * and the reading column does not grow with the display.
		 *
		 * `-my-8` cancels the shell's `main` margin so the band meets the navigation above it
		 * and the footer below with no Paper gap. A hero that floats in the page is a section;
		 * one that touches both edges is a band.
		 */
		<section
			className="-my-8 w-full"
			style={
				{ "--bleed": "max(1.5rem, calc((100vw - 80rem) / 2))" } as CSSProperties
			}
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
			<div className="grid items-stretch xl:grid-cols-2">
				<div className="flex flex-col justify-center gap-8 border-b bg-muted px-6 py-10 md:px-12 xl:border-r xl:border-b-0 xl:py-16 xl:pr-12 xl:pl-[var(--bleed)]">
					<div>
						<h1 className="text-balance font-bold text-[clamp(1.75rem,3.4vw,2.5rem)] text-foreground leading-[1.12] tracking-[-0.025em]">
							Middlesex County Mosquito Extermination Commission
						</h1>
						<p className="mt-4 max-w-[46ch] text-base text-muted-foreground leading-relaxed md:text-lg">
							Protecting the health and comfort of Middlesex County residents
							and visitors since 1914.
						</p>
					</div>

					{/*
					 * A container query, not a viewport one. The register's width is now half the
					 * page rather than all of it, so `sm:grid-cols-2` would put two columns in a
					 * 448px panel at exactly the width the layout splits — the panel has to be
					 * asked about itself.
					 */}
					<div className="@container">
						<h2 className="sr-only">How can we help you today?</h2>
						<div className="grid @lg:grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border">
							{leadDestinations.map((destination) => (
								<DestinationCell
									destination={destination}
									key={destination.href}
									lead
								/>
							))}
							{furtherDestinations.map((destination) => (
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
		</section>
	);
}

function DestinationCell({
	destination,
	lead = false,
}: {
	destination: Destination;
	lead?: boolean;
}) {
	const Icon = destination.icon;

	return (
		<Link
			// `relative` and the raised z on focus keep the 3px ring from being clipped by the
			// neighbouring cell, the same reason the Signal Band raises its cells.
			className={cn(
				"group relative flex flex-col gap-1.5 bg-card transition-colors hover:bg-secondary focus-visible:z-10 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
				lead ? "p-5 sm:p-6" : "p-4 sm:p-5",
			)}
			to={destination.href}
		>
			<Icon
				className={cn("text-primary", lead ? "size-6" : "size-5")}
				strokeWidth={1.75}
			/>
			<span
				className={cn(
					"mt-1 flex items-center gap-1.5 font-semibold text-foreground",
					lead ? "text-lg" : "text-sm",
				)}
			>
				{destination.title}
				{lead ? (
					<ArrowRight
						aria-hidden="true"
						className="size-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
					/>
				) : null}
			</span>
			<span className="text-muted-foreground text-sm leading-snug">
				{destination.description}
			</span>
		</Link>
	);
}
