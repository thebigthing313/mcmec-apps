import { formatDate } from "@mcmec/lib/functions/date-fns";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { jobPostingsQueryOptions } from "@/src/lib/queries";

export const Route = createFileRoute("/about/job-opportunities/")({
	component: RouteComponent,
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
			<article className="prose lg:prose-xl mb-8 max-w-none">
				<h1>Job Opportunities</h1>
				<p>
					The Middlesex County Mosquito Extermination Commission is an equal
					opportunity employer. Below are our current job openings. Click on a
					posting to view full details.
				</p>
			</article>

			{sortedPostings.length > 0 ? (
				<ul className="flex flex-col gap-4">
					{sortedPostings.map((posting) => (
						<li key={posting.id}>
							<Link
								className="block rounded-lg border bg-card p-6 transition-colors hover:bg-accent/50"
								params={{ postingId: posting.id }}
								to="/about/job-opportunities/$postingId"
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
