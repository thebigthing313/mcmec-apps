import { COMPANY_INFO } from "@mcmec/lib/constants/company";
import {
	MeetingsRowSchema,
	type MeetingsRowType,
} from "@mcmec/supabase/db/meetings";
import { createFileRoute } from "@tanstack/react-router";
import { MeetingsForm } from "@/src/components/meetings-form";
import { meetings } from "@/src/lib/collections/meetings";

export const Route = createFileRoute("/(app)/meetings/create")({
	component: RouteComponent,
	loader: () => {
		return { crumb: "Create New Meeting" };
	},
});

function RouteComponent() {
	const navigate = Route.useNavigate();
	const handleSubmit = async (value: MeetingsRowType) => {
		const parsedItems = MeetingsRowSchema.parse(value);
		meetings.insert(parsedItems);
		navigate({ to: "/meetings" });
	};

	// Set default meeting_at to today at 12:00 PM local time
	const defaultMeetingAt = new Date();
	defaultMeetingAt.setHours(12, 0, 0, 0);

	const defaultValues: MeetingsRowType = {
		agenda_url: null,
		created_at: new Date(),
		created_by: null,
		id: crypto.randomUUID(),
		is_cancelled: false,
		location: COMPANY_INFO.address,
		meeting_at: defaultMeetingAt,
		minutes_url: null,
		name: "",
		notes: null,
		notice_url: null,
		report_url: null,
		updated_at: new Date(),
		updated_by: null,
	};

	return (
		<MeetingsForm
			defaultValues={defaultValues}
			formLabel="Create New Meeting"
			onSubmit={handleSubmit}
			submitLabel="Create"
		/>
	);
}
