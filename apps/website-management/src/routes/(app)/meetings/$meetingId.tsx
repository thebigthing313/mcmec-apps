import { formatDateTime } from "@mcmec/lib/functions/date-fns";
import { DangerZoneCard } from "@mcmec/ui/blocks/danger-zone-card";
import { LifecycleButton } from "@mcmec/ui/blocks/lifecycle-button";
import { Badge } from "@mcmec/ui/components/badge";
import { Button } from "@mcmec/ui/components/button";
import { toastOnError } from "@mcmec/ui/lib/toast-on-error";
import { eq, useLiveQuery } from "@tanstack/react-db";
import {
	createFileRoute,
	Link,
	notFound,
	useNavigate,
} from "@tanstack/react-router";
import {
	ArrowLeft,
	CalendarOff,
	CalendarPlus,
	Edit,
	ExternalLink,
} from "lucide-react";
import { intents, meetings } from "@/src/lib/db";
import { runLifecycle } from "@/src/lib/lifecycle";

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

function RouteComponent() {
	const { meeting: loadedMeeting } = Route.useLoaderData();
	const { meetingId } = Route.useParams();
	const navigate = useNavigate();

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
	const {
		id,
		name,
		location,
		meeting_at,
		is_cancelled,
		minutes_url,
		notice_url,
		notes,
	} = meeting;

	const links = [
		{ label: "Minutes", url: minutes_url },
		{ label: "48-Hour Notice", url: notice_url },
	].filter((link) => link.url);

	// The notes-required rule lives in the handler, so Cancel is offered unconditionally and a
	// refusal comes back as a 409 whose message is written for the person who clicked.
	//
	// No form under this, so no `isDirty` and no relabel: a detail-view lifecycle button always
	// sends exactly one intent. The page stays put afterwards — the badge below is live, so the
	// result of the click is visible where the click was.
	const cancel = is_cancelled
		? {
				icon: <CalendarPlus />,
				label: "Reinstate Meeting",
				onAct: () =>
					runLifecycle(meetings, id, {
						apply: (draft) => {
							draft.is_cancelled = false;
						},
						command: "website.uncancelMeeting",
						failure: "Failed to reinstate meeting.",
					}),
			}
		: {
				icon: <CalendarOff />,
				label: "Cancel Meeting",
				onAct: () =>
					runLifecycle(meetings, id, {
						apply: (draft) => {
							draft.is_cancelled = true;
						},
						command: "website.cancelMeeting",
						failure: "Failed to cancel meeting.",
					}),
			};

	// Delete is the one action whose placement is not free — detail page only, danger zone,
	// behind a confirm (ADR 0001). It leaves the page because the record it was showing is gone.
	const handleDelete = () => {
		const tx = meetings.delete(id, intents("website.deleteMeeting"));
		toastOnError(tx, "Failed to delete meeting.");
		navigate({ to: "/meetings" });
	};

	return (
		<div className="max-w-2xl space-y-6">
			<nav className="flex items-center justify-between rounded-lg border bg-card p-4">
				<Button asChild size="sm" variant="outline">
					<Link to="/meetings">
						<ArrowLeft />
						Back to Meetings
					</Link>
				</Button>
				<div className="flex items-center gap-2">
					<Button asChild size="sm" variant="outline">
						<Link params={{ meetingId: id }} to="/meetings/$meetingId/edit">
							<Edit />
							Edit
						</Link>
					</Button>
					<LifecycleButton
						icon={cancel.icon}
						label={cancel.label}
						onAct={cancel.onAct}
						size="sm"
					/>
				</div>
			</nav>

			<article className="prose">
				<div className="flex flex-row items-baseline gap-2">
					<h2>{name}</h2>
					{is_cancelled ? (
						<Badge variant="secondary">Cancelled</Badge>
					) : (
						<Badge variant="default">Scheduled</Badge>
					)}
				</div>
				<h4>{formatDateTime(meeting_at)}</h4>
				<h4>{location}</h4>
				{/* A cancelled meeting stays on the public meetings page carrying its notes —
				    `shapes.ts` gives `meetings` no predicate at all, so cancelling changes what
				    the page says about the meeting, never whether it appears. */}
				{notes ? <p>{notes}</p> : null}
				{links.length > 0 ? (
					<div className="flex flex-wrap gap-4">
						{links.map((link) => (
							<a
								className="inline-flex items-center gap-1"
								href={link.url as string}
								key={link.label}
								rel="noopener noreferrer"
								target="_blank"
							>
								<ExternalLink className="h-4 w-4" />
								{link.label}
							</a>
						))}
					</div>
				) : null}
			</article>

			<DangerZoneCard
				label="Delete Meeting"
				onConfirm={handleDelete}
				recordName={name}
			/>
		</div>
	);
}
