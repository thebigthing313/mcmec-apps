import { COMPANY_INFO } from "@mcmec/lib/constants/company";
import { createFileRoute, Link, type LinkProps } from "@tanstack/react-router";
import { parsePhoneNumberWithError } from "libphonenumber-js";
import { canonical, seo } from "@/src/lib/seo";

export const Route = createFileRoute("/contact/service-request")({
	component: RouteComponent,
	head: () => ({
		meta: seo({
			title: "Make a Public Request - MCMEC",
			description:
				"Ask the Middlesex County Mosquito Extermination Commission to look at a mosquito problem, standing water, or a pond that could take mosquitofish.",
			url: "/contact/service-request",
		}),
		links: [canonical("/contact/service-request")],
	}),
});

type PublicRequestOption = {
	title: string;
	description: string;
	link: LinkProps["to"];
};

const options: Array<PublicRequestOption> = [
	{
		description:
			"Select this option if you are experiencing a high number of mosquitoes on your property or in your immediate area and believe they are causing a nuisance.",

		link: "/contact/adult-mosquito-requests",
		title: "Adult Mosquito Nuisance",
	},
	{
		description:
			"Choose this if you are reporting a large area of standing water (e.g., a ditch, ponding in a field, clogged storm drain) that you believe is creating a mosquito breeding habitat.",

		link: "/contact/water-management-requests",
		title: "Water Management",
	},
	{
		description:
			"Select this if you have a contained body of water on your property (e.g., an ornamental pond) and are interested in receiving mosquitofish. These fish are a natural and effective way to control mosquito larvae.",

		link: "/contact/mosquitofish-requests",
		title: "Mosquitofish",
	},
];
function RouteComponent() {
	return (
		<div className="mx-auto w-full max-w-7xl p-4">
			<article className="prose lg:prose-base max-w-none">
				<h1>Make a Public Request</h1>
				<p>
					Ask the Commission to look at something, and it goes straight to
					staff. There is no account to create and no password to remember — we
					ask for your name and phone number so an inspector can reach you if
					they cannot find the problem. Choose what you need:
				</p>
				<div className="mt-8 flex flex-col gap-4">
					{options.map((option) => (
						<Link className="no-underline" key={option.title} to={option.link}>
							<div className="flex flex-1 flex-col rounded-lg border border-accent p-6 transition-all duration-200 ease-in-out hover:border-primary hover:bg-primary/10">
								{/*
								 * A heading, not a styled div. These three cards are the whole
								 * choice this page offers and none of them appeared in the
								 * outline. `mt-0` holds prose's heading margin off so the card
								 * keeps the spacing it had.
								 */}
								<h2 className="mt-0 mb-4 font-bold text-2xl">{option.title}</h2>
								<div className="font-normal text-lg">{option.description}</div>
							</div>
						</Link>
					))}
				</div>
				<p>
					For anything else, call the office at{" "}
					<a href={`tel:${COMPANY_INFO.phone}`}>
						{parsePhoneNumberWithError(COMPANY_INFO.phone).formatNational()}
					</a>{" "}
					or send us a <Link to="/contact/contact-us">general inquiry</Link>.
				</p>
			</article>
		</div>
	);
}
