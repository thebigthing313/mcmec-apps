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
});

function RouteComponent() {
	const { posting } = Route.useLoaderData();

	return (
		<div className="flex flex-col gap-4">
			<div>
				<Button asChild variant="link">
					<Link to="/job-opportunities">
						<ArrowLeft />
						Back to Job Opportunities
					</Link>
				</Button>
			</div>

			<article className="prose lg:prose-xl max-w-none">
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
