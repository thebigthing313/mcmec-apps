import type { CommandName } from "@mcmec/domain";
import { ErrorMessages } from "@mcmec/lib/constants/errors";
import { LifecycleButton } from "@mcmec/ui/blocks/lifecycle-button";
import { rowVersion, useFormSeed } from "@mcmec/ui/hooks/use-form-seed";
import { toastOnError } from "@mcmec/ui/lib/toast-on-error";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarOff, CalendarPlus } from "lucide-react";
import {
	type MeetingFormValues,
	MeetingsForm,
} from "@/src/components/meetings-form";
import { intents, meetings } from "@/src/lib/db";
import { changedFields, type Draft, runLifecycle } from "@/src/lib/lifecycle";

export const Route = createFileRoute("/(app)/meetings/$meetingId_/edit")({
	component: RouteComponent,
	loader: async ({ params }) => {
		await meetings.preload();
		const meeting = meetings.get(params.meetingId);
		if (!meeting) {
			throw new Error(ErrorMessages.DATABASE.RECORD_NOT_AVAILABLE);
		}
		return { crumb: "Edit", meeting };
	},
});

type MeetingDraft = Draft<typeof meetings>;

/** Exactly the fields `website.updateMeetingDetails` accepts — the Save half of a Save-and-X. */
function detailValues(value: MeetingFormValues): MeetingFormValues {
	return {
		location: value.location,
		meeting_at: value.meeting_at,
		minutes_url: value.minutes_url,
		name: value.name,
		notes: value.notes,
		notice_url: value.notice_url,
	};
}

function RouteComponent() {
	const navigate = Route.useNavigate();
	const { meeting: loadedMeeting } = Route.useLoaderData();
	const { meetingId } = Route.useParams();

	// Seed from the live row, not the loader's one-shot read — see @mcmec/ui/hooks/use-form-seed.
	const { data: liveMeetings } = useLiveQuery(
		(q) =>
			q
				.from({ meeting: meetings })
				.where(({ meeting }) => eq(meeting.id, meetingId)),
		[meetingId],
	);
	const meeting = liveMeetings[0] ?? loadedMeeting;
	const { seedKey, latchProps } = useFormSeed(rowVersion(meeting));

	const handleSubmit = async (value: MeetingFormValues) => {
		const tx = meetings.update(
			meetingId,
			intents("website.updateMeetingDetails"),
			(draft) => {
				Object.assign(draft, detailValues(value));
			},
		);
		toastOnError(tx, "Failed to update meeting.");
		navigate({ params: { meetingId }, to: "/meetings/$meetingId" });
	};

	return (
		<div className="space-y-4" {...latchProps}>
			<MeetingsForm
				actions={({ values }) => {
					// Diffed against the LIVE row, so the label and the payload cannot disagree:
					// if this is empty the button stays "Cancel Meeting" and sends one intent,
					// and `updateMeetingDetails` is never handed a payload its own non-empty
					// refinement would refuse.
					const changes = changedFields(detailValues(values), meeting);
					const isDirty = Object.keys(changes).length > 0;

					// One request, both intents, one transaction — so the two either land
					// together or roll back together. That ordering is what makes Save-and-Cancel
					// work at all: `updateMeetingDetails` runs first, so a reason typed into the
					// notes field is on the row before `cancelMeeting` reads it.
					const act =
						(
							command: CommandName,
							apply: (draft: MeetingDraft) => void,
							failure: string,
						) =>
						(withSave: boolean) =>
							runLifecycle(meetings, meetingId, {
								apply,
								command,
								failure,
								save: withSave
									? { changes, command: "website.updateMeetingDetails" }
									: undefined,
							});

					const cancel = meeting.is_cancelled
						? {
								icon: <CalendarPlus />,
								label: "Reinstate Meeting",
								onAct: act(
									"website.uncancelMeeting",
									(draft) => {
										draft.is_cancelled = false;
									},
									"Failed to reinstate meeting.",
								),
							}
						: {
								icon: <CalendarOff />,
								label: "Cancel Meeting",
								onAct: act(
									"website.cancelMeeting",
									(draft) => {
										draft.is_cancelled = true;
									},
									"Failed to cancel meeting.",
								),
							};

					return (
						<LifecycleButton
							className="w-full"
							icon={cancel.icon}
							isDirty={isDirty}
							label={cancel.label}
							onAct={cancel.onAct}
						/>
					);
				}}
				defaultValues={{
					location: meeting.location,
					meeting_at: meeting.meeting_at,
					minutes_url: meeting.minutes_url,
					name: meeting.name,
					notes: meeting.notes,
					notice_url: meeting.notice_url,
				}}
				formLabel="Edit Meeting"
				key={seedKey}
				onSubmit={handleSubmit}
				submitLabel="Update"
			/>
		</div>
	);
}
