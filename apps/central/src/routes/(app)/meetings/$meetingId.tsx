import { PUBLIC_SITE_URL } from "@mcmec/lib/constants/apps";
import { formatDateTime } from "@mcmec/lib/functions/date-fns";
import { meetingStatus } from "@mcmec/lib/functions/meeting-status";
import { RecordDetail } from "@mcmec/ui/blocks/record-detail";
import { Badge } from "@mcmec/ui/components/badge";
import { Button } from "@mcmec/ui/components/button";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { meetings } from "@/src/lib/db";

export const Route = createFileRoute("/(app)/meetings/$meetingId")({
	component: RouteComponent,
	loader: async ({ params }) => {
		await meetings.preload();
		const meeting = meetings.get(params.meetingId);
		if (!meeting) {
			throw notFound();
		}
		return { crumb: meeting.name, meeting };
	},
});

/**
 * A meeting's public record, read-only.
 *
 * Central carries no lifecycle actions and no danger zone: cancelling a meeting is a
 * `manage_website` command, and a button that every employee can see but only some can fire
 * would be the disabled-action rule stretched past what it is for. What an employee needs from
 * this screen is whether the meeting is on, where it is, and whether its two statutory documents
 * are posted — so the documents are named fields that say "Not posted" out loud rather than
 * links that silently aren't there.
 */
function RouteComponent() {
	const { meeting: loadedMeeting } = Route.useLoaderData();
	const { meetingId } = Route.useParams();

	// Read live rather than from the loader's one-shot read, which can land on the shape
	// snapshot before the change log applies — see @mcmec/ui/hooks/use-form-seed.
	const { data: liveMeetings } = useLiveQuery(
		(q) =>
			q
				.from({ meeting: meetings })
				.where(({ meeting }) => eq(meeting.id, meetingId)),
		[meetingId],
	);
	const meeting = liveMeetings[0] ?? loadedMeeting;
	const { name, location, meeting_at, is_cancelled, minutes_url, notice_url } =
		meeting;

	const status = meetingStatus({
		isCancelled: is_cancelled,
		meetingAt: new Date(meeting_at),
	});

	const documentField = (label: string, url: string | null) => ({
		label,
		value: url ? (
			<a
				className="inline-flex items-center gap-1 rounded-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
				href={url}
				rel="noopener noreferrer"
				target="_blank"
			>
				<ExternalLink className="h-4 w-4" />
				Open
			</a>
		) : (
			<span className="text-muted-foreground">Not posted</span>
		),
	});

	return (
		<RecordDetail
			actions={
				<Button asChild size="sm" variant="outline">
					<a
						href={`${PUBLIC_SITE_URL}/notices/meetings`}
						rel="noopener noreferrer"
						target="_blank"
					>
						<ExternalLink />
						View public calendar
					</a>
				</Button>
			}
			backLink={
				<Button asChild size="sm" variant="outline">
					<Link search={true} to="/meetings">
						<ArrowLeft />
						Back to Public Meetings
					</Link>
				</Button>
			}
			badge={<Badge variant={status.variant}>{status.label}</Badge>}
			fields={[
				{ label: "When", value: formatDateTime(meeting_at) },
				{ label: "Location", value: location },
				documentField("48-hour notice", notice_url),
				documentField("Minutes", minutes_url),
			]}
			title={name}
		>
			{/* A cancelled meeting stays on the public meetings page carrying its notes —
			    `shapes.ts` gives `meetings` no predicate at all, so cancelling changes what the
			    page says about the meeting, never whether it appears. The notes are therefore
			    published text, and this is where an employee reads the reason. */}
			{meeting.notes ? (
				<p className="text-foreground">{meeting.notes}</p>
			) : null}
		</RecordDetail>
	);
}
