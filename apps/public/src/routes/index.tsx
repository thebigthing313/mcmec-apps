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
		<section className="mx-auto w-full max-w-7xl px-6 md:px-12">
			<script
				// biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD structured data
				dangerouslySetInnerHTML={{ __html: organizationJsonLd }}
				type="application/ld+json"
			/>

			{/*
			 * The plate is last in the DOM and rightmost on a wide screen, so reading order and
			 * tab order are the same order in both layouts: the heading, then the destinations,
			 * then the photographs. Below `lg` that also puts the six answers above the imagery,
			 * which is the right way round for someone who arrived with one urgent question.
			 */}
			<div className="grid items-stretch gap-8 lg:grid-cols-2 lg:gap-12">
				<div className="flex flex-col justify-center gap-8">
					<div>
						<h1 className="text-balance font-bold text-[clamp(1.75rem,3.4vw,2.5rem)] text-foreground leading-[1.12] tracking-[-0.025em]">
							Middlesex County Mosquito Extermination Commission
						</h1>
						<p className="mt-4 max-w-[46ch] text-base text-muted-foreground leading-relaxed md:text-lg">
							Protecting the health and comfort of Middlesex County residents
							and visitors since 1914.
						</p>
					</div>

					<div>
						<h2 className="sr-only">How can we help you today?</h2>
						<div className="grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2">
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
