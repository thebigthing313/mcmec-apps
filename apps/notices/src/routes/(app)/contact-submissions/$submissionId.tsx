import { formatDateShort } from "@mcmec/lib/functions/date-fns";
import { Badge } from "@mcmec/ui/components/badge";
import { Button } from "@mcmec/ui/components/button";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Edit } from "lucide-react";
import { toastOnError } from "@/src/lib/toast-on-error";

export const Route = createFileRoute(
	"/(app)/contact-submissions/$submissionId",
)({
	component: RouteComponent,
	loader: () => {
		return { crumb: "Submission Detail" };
	},
});

function RouteComponent() {
	const { db } = Route.useRouteContext();
	const { submissionId } = Route.useParams();

	const { data: submission } = useLiveQuery(
		(q) =>
			q
				.from({ s: db.contactFormSubmissions })
				.where(({ s }) => eq(s.id, submissionId))
				.findOne(),
		[submissionId],
	);

	if (!submission) {
		return null;
	}

	const handleToggleClose = async () => {
		const tx = db.contactFormSubmissions.update(submission.id, (draft) => {
			draft.is_closed = !draft.is_closed;
		});
		toastOnError(tx, "Failed to update submission status.");
	};

	return (
		<div className="max-w-2xl space-y-6">
			<nav className="flex items-center justify-between rounded-lg border bg-card p-4">
				<Button asChild size="sm" variant="outline">
					<Link to="/contact-submissions">
						<ArrowLeft />
						Back to Submissions
					</Link>
				</Button>
				<div className="flex items-center gap-2">
					<Button asChild size="sm" variant="outline">
						<Link
							params={{ submissionId: submission.id }}
							to="/contact-submissions/$submissionId/edit"
						>
							<Edit />
							Edit
						</Link>
					</Button>
					<Button
						onClick={handleToggleClose}
						size="sm"
						variant={submission.is_closed ? "default" : "destructive"}
					>
						{submission.is_closed ? "Reopen" : "Close"}
					</Button>
				</div>
			</nav>

			<article className="space-y-4">
				<div className="flex items-baseline gap-2">
					<h2 className="font-bold text-2xl">{submission.subject}</h2>
					<Badge variant={submission.is_closed ? "secondary" : "default"}>
						{submission.is_closed ? "Closed" : "Open"}
					</Badge>
				</div>

				<div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
					<div>
						<p className="text-muted-foreground text-sm">Name</p>
						<p className="font-medium">{submission.name}</p>
					</div>
					<div>
						<p className="text-muted-foreground text-sm">Email</p>
						<p className="font-medium">{submission.email}</p>
					</div>
					<div>
						<p className="text-muted-foreground text-sm">Submitted</p>
						<p className="font-medium">
							{formatDateShort(submission.created_at)}
						</p>
					</div>
				</div>

				<div className="rounded-lg border p-4">
					<h3 className="mb-2 font-semibold">Message</h3>
					<p className="whitespace-pre-wrap">{submission.message}</p>
				</div>
			</article>
		</div>
	);
}
