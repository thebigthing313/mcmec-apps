import {
	getJobPostingStatus,
	type JobPostingStatus,
} from "@mcmec/lib/functions/job-posting-status";
import { TiptapRenderer } from "@mcmec/ui/blocks/tiptap-renderer";
import { Badge } from "@mcmec/ui/components/badge";
import { Button } from "@mcmec/ui/components/button";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Edit } from "lucide-react";
import { jobPostings } from "@/src/lib/db";

export const Route = createFileRoute("/(app)/job-postings/$postingId")({
	component: RouteComponent,
	loader: async ({ params }) => {
		await jobPostings.stateWhenReady();
		const posting = jobPostings.get(params.postingId);
		if (!posting) {
			throw notFound();
		}
		return { crumb: posting.title, posting };
	},
});

const statusDisplay: Record<
	JobPostingStatus,
	{
		label: string;
		variant: "default" | "destructive" | "outline" | "secondary";
	}
> = {
	closed: { label: "Closed", variant: "destructive" },
	draft: { label: "Draft", variant: "outline" },
	pending: { label: "Pending", variant: "secondary" },
	published: { label: "Published", variant: "default" },
};

function RouteComponent() {
	const { posting } = Route.useLoaderData();
	const { postingId } = Route.useParams();
	const status = statusDisplay[getJobPostingStatus(posting)];

	return (
		<div className="max-w-2xl space-y-6">
			<nav className="flex items-center justify-between rounded-lg border bg-card p-4">
				<Button asChild size="sm" variant="outline">
					<Link to="/job-postings">
						<ArrowLeft />
						Back to Job Postings
					</Link>
				</Button>
				<Button asChild size="sm" variant="outline">
					<Link params={{ postingId }} to="/job-postings/$postingId/edit">
						<Edit />
						Edit
					</Link>
				</Button>
			</nav>

			<div className="space-y-4 rounded-lg border bg-card p-6">
				<div className="flex items-center gap-3">
					<h2 className="font-bold text-2xl">{posting.title}</h2>
					<Badge variant={status.variant}>{status.label}</Badge>
				</div>

				<dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
					<dt className="font-medium text-muted-foreground">Published At</dt>
					<dd>
						{posting.published_at
							? new Date(posting.published_at).toLocaleDateString()
							: "—"}
					</dd>

					<dt className="font-medium text-muted-foreground">Closed</dt>
					<dd>{posting.is_closed ? "Yes" : "No"}</dd>

					<dt className="font-medium text-muted-foreground">Created</dt>
					<dd>{new Date(posting.created_at).toLocaleDateString()}</dd>

					<dt className="font-medium text-muted-foreground">Updated</dt>
					<dd>{new Date(posting.updated_at).toLocaleDateString()}</dd>
				</dl>
			</div>

			<div className="rounded-lg border bg-card p-6">
				<h3 className="mb-4 font-semibold text-lg">Content</h3>
				<TiptapRenderer content={posting.content} />
			</div>
		</div>
	);
}
