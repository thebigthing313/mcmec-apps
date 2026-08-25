import { COMPANY_INFO } from "@mcmec/lib/constants/company";
import { createFileRoute } from "@tanstack/react-router";
import {
	type MeetingFormValues,
	MeetingsForm,
} from "@/src/components/meetings-form";
import { intents, meetings } from "@/src/lib/db";
import { toastOnError } from "@/src/lib/toast-on-error";

export const Route = createFileRoute("/(app)/meetings/create")({
	component: RouteComponent,
	loader: () => {
		return { crumb: "Create New Meeting" };
	},
});

function RouteComponent() {
	const navigate = Route.useNavigate();

	const handleSubmit = async (value: MeetingFormValues) => {
		const now = new Date();
		const tx = meetings.insert(
			{
				...value,
				created_at: now,
				// The id we mint here is the id the row will have: the envelope carries it and
				// the handler honours it. Under the old path it was thrown away server-side, so
				// the optimistic row and the committed row had different keys on every insert.
				id: crypto.randomUUID(),
				// Not a field on the form and not in `createMeeting`'s payload: a meeting is born
				// scheduled, and the only way out is `cancelMeeting`. The optimistic row still
				// needs the column, because the collection holds whole rows.
				is_cancelled: false,
				updated_at: now,
			},
			intents("website.createMeeting"),
		);
		toastOnError(tx, "Failed to create meeting.");
		navigate({ to: "/meetings" });
	};

	// Set default meeting_at to today at 12:00 PM local time
	const defaultMeetingAt = new Date();
	defaultMeetingAt.setHours(12, 0, 0, 0);

	return (
		<MeetingsForm
			defaultValues={{
				location: COMPANY_INFO.address,
				meeting_at: defaultMeetingAt,
				minutes_url: null,
				name: "",
				notes: null,
				notice_url: null,
			}}
			formLabel="Create New Meeting"
			onSubmit={handleSubmit}
			submitLabel="Create"
		/>
	);
}
