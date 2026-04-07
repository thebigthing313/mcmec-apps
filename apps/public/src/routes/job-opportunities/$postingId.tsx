import {
	formatDate,
	formatDateShort,
	formatTime,
} from "@mcmec/lib/functions/date-fns";
import { TiptapRenderer } from "@mcmec/ui/blocks/tiptap-renderer";
import { Button } from "@mcmec/ui/components/button";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { jobPostingsQueryOptions } from "@/src/lib/queries";
import { canonical, seo } from "@/src/lib/seo";

export const Route = createFileRoute("/job-opportunities/$postingId")({
	component: RouteComponent,
	loader: async ({ params, context }) => {
		const postings = await context.queryClient.ensureQueryData(
			jobPostingsQueryOptions(),
		);
		const posting = postings.find((p) => p.id === params.postingId);
		if (!posting) {
			throw notFound();
		}
		return { posting };
	},
	head: ({ loaderData, params }) => ({
		meta: seo({
			title: loaderData?.posting
				? `${loaderData.posting.title} - Job Opportunity - MCMEC`
				: "Job Opportunity - MCMEC",
			description: loaderData?.posting
				? `Job opening at the Middlesex County Mosquito Extermination Commission: ${loaderData.posting.title}.`
				: "Job opening at the Middlesex County Mosquito Extermination Commission.",
			url: `/job-opportunities/${params.postingId}`,
			type: "article",
		}),
		links: [canonical(`/job-opportunities/${params.postingId}`)],
	}),
});

function RouteComponent() {
	const { posting } = Route.useLoaderData();

	const jobPostingJsonLd = JSON.stringify({
		"@context": "https://schema.org",
		"@type": "JobPosting",
		title: posting.title,
		datePosted: posting.published_at,
		hiringOrganization: {
			"@type": "GovernmentOrganization",
			name: "Middlesex County Mosquito Extermination Commission",
			sameAs: "https://middlesexmosquito.org",
		},
		jobLocation: {
			"@type": "Place",
			address: {
				"@type": "PostalAddress",
				streetAddress: "200 Parsonage Road",
				addressLocality: "Edison",
				addressRegion: "NJ",
				postalCode: "08837",
				addressCountry: "US",
			},
		},
	});

	return (
		<div className="flex flex-col gap-4">
			<script
				// biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD structured data
				dangerouslySetInnerHTML={{ __html: jobPostingJsonLd }}
				type="application/ld+json"
			/>
			<div>
				<Button asChild variant="link">
					<Link to="/job-opportunities">
						<ArrowLeft />
						Back to Job Opportunities
					</Link>
				</Button>
			</div>

			<article className="prose lg:prose-base max-w-none">
				<h1>{posting.title}</h1>
				<p className="text-muted-foreground">
					{posting.published_at && (
						<>Posted {formatDate(posting.published_at)}</>
					)}
				</p>
				<TiptapRenderer content={posting.content} />
			</article>

			<div className="flex flex-col text-muted text-sm italic">
				<p>
					Last updated: {formatDateShort(posting.updated_at)}{" "}
					{formatTime(posting.updated_at)}
				</p>
			</div>
		</div>
	);
}
