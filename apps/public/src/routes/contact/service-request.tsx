import { createFileRoute, Link, type LinkProps } from "@tanstack/react-router";

export const Route = createFileRoute("/contact/service-request")({
	component: RouteComponent,
});

type ServiceRequestOption = {
	title: string;
	description: string;
	link: LinkProps["to"];
};

const options: Array<ServiceRequestOption> = [
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
		title: "Interested in Mosquitofish",
	},
];
function RouteComponent() {
	return (
		<div className="mx-auto w-full max-w-7xl p-4">
			<article className="prose lg:prose-xl max-w-none">
				<h1>Service Request</h1>
				<p>
					Residents can submit an official service request through this page.
					The Commission will review and respond to your request as soon as
					possible. Please note that we do not accept anonymous requests. You
					can request the following services:
				</p>
				<div className="mt-8 flex flex-col gap-4">
					{options.map((option) => (
						<Link className="no-underline" key={option.title} to={option.link}>
							<div className="flex flex-1 flex-col rounded-lg border border-accent p-6 transition-all duration-200 ease-in-out hover:border-primary hover:bg-primary/10">
								<div className="mb-4 font-bold text-2xl">{option.title}</div>
								<div className="font-normal text-lg">{option.description}</div>
							</div>
						</Link>
					))}
				</div>
				<p>
					For other requests or questions, please contact our office at (732)
					549-0665 or by using our general contact form linked{" "}
					<Link to="/contact/contact-us">here</Link>.
				</p>
			</article>
		</div>
	);
}
