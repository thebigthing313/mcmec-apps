import { formatDate } from "@mcmec/lib/functions/date-fns";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { jobPostingsQueryOptions } from "@/src/lib/queries";
import { canonical, seo } from "@/src/lib/seo";

export const Route = createFileRoute("/job-opportunities/")({
	component: RouteComponent,
	head: () => ({
		meta: seo({
			title: "Job Opportunities - MCMEC",
			description:
				"Current job openings at the Middlesex County Mosquito Extermination Commission.",
			url: "/job-opportunities",
		}),
		links: [canonical("/job-opportunities")],
	}),
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(jobPostingsQueryOptions());
	},
});

function RouteComponent() {
	const { data: postings } = useSuspenseQuery(jobPostingsQueryOptions());

	const sortedPostings = postings
		.filter((p) => p.published_at !== null)
		.sort(
			(a, b) =>
				new Date(b.published_at as Date).getTime() -
				new Date(a.published_at as Date).getTime(),
		);

	return (
		<div className="flex flex-col gap-4">
			<article className="prose lg:prose-base mb-8 max-w-none">
				<h1>Job Opportunities</h1>
				<p>
					The Middlesex County Mosquito Extermination Commission has
					opportunities for people who want to make a tangible difference in
					their community. Our work protects public health by limiting the
					spread of mosquito-borne diseases like West Nile virus and Eastern
					Equine Encephalitis, and improves quality of life by keeping nuisance
					mosquito populations in check across Middlesex County. MCMEC offers a
					competitive benefits package, including enrollment in the New Jersey
					Public Employees' Retirement System (PERS), health and dental
					insurance, and generous paid vacation, sick, and holiday leave. MCMEC
					is an equal opportunity employer. Below are our current job openings —
					click any posting to view full details.
				</p>
			</article>

			{sortedPostings.length > 0 ? (
				<ul className="flex flex-col gap-4">
					{sortedPostings.map((posting) => (
						<li key={posting.id}>
							<Link
								className="block rounded-lg border bg-card p-6 transition-colors hover:bg-accent/50"
								params={{ postingId: posting.id }}
								to="/job-opportunities/$postingId"
							>
								<h2 className="font-semibold text-xl">{posting.title}</h2>
								<p className="mt-1 text-muted-foreground text-sm">
									Posted {formatDate(posting.published_at as Date)}
								</p>
							</Link>
						</li>
					))}
				</ul>
			) : (
				<div className="rounded-lg border bg-card p-8 text-center">
					<p className="text-muted-foreground">
						There are no job openings at this time. Please check back later.
					</p>
				</div>
			)}
		</div>
	);
}
