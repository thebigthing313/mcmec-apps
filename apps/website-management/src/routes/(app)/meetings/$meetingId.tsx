import { ErrorMessages } from "@mcmec/lib/constants/errors";
import type { MeetingsRowType } from "@mcmec/supabase/db/meetings";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@mcmec/ui/components/alert-dialog";
import { Button } from "@mcmec/ui/components/button";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import { MeetingsForm } from "@/src/components/meetings-form";
import { meetings } from "@/src/lib/db";
import { toastOnError } from "@/src/lib/toast-on-error";
import { rowVersion, useFormSeed } from "@/src/lib/use-form-seed";

export const Route = createFileRoute("/(app)/meetings/$meetingId")({
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

function RouteComponent() {
	const navigate = Route.useNavigate();
	const { meeting: loadedMeeting } = Route.useLoaderData();
	const { meetingId } = Route.useParams();

	// Seed from the live row, not the loader's one-shot read — see use-form-seed.ts.
	const { data: liveMeetings } = useLiveQuery(
		(q) =>
			q
				.from({ meeting: meetings })
				.where(({ meeting }) => eq(meeting.id, meetingId)),
		[meetingId],
	);
	const meeting = liveMeetings[0] ?? loadedMeeting;
	const { seedKey, latchProps } = useFormSeed(rowVersion(meeting));

	const handleSubmit = async (value: MeetingsRowType) => {
		const tx = meetings.update(meetingId, (draft) => {
			Object.assign(draft, value);
		});
		toastOnError(tx, "Failed to update meeting.");
		navigate({ to: "/meetings" });
	};

	const handleDelete = async () => {
		const tx = meetings.delete(meetingId);
		toastOnError(tx, "Failed to delete meeting.");
		navigate({ to: "/meetings" });
	};

	const defaultValues: MeetingsRowType = { ...meeting };

	return (
		<div className="space-y-4" {...latchProps}>
			<MeetingsForm
				defaultValues={defaultValues}
				formLabel="Edit Meeting"
				key={seedKey}
				onSubmit={handleSubmit}
				submitLabel="Update"
			/>

			<div className="max-w-2xl">
				<AlertDialog>
					<AlertDialogTrigger asChild>
						<Button className="w-full" variant="destructive">
							Delete Meeting
						</Button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
							<AlertDialogDescription>
								This action cannot be undone. This will permanently delete the
								meeting "{meeting.name}".
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction onClick={handleDelete}>
								Delete
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>
		</div>
	);
}
