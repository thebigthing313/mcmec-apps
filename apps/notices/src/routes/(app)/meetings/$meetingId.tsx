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
import { createFileRoute } from "@tanstack/react-router";
import { MeetingsForm } from "@/src/components/meetings-form";
import { meetings } from "@/src/lib/collections/meetings";

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
	const { meeting } = Route.useLoaderData();
	const { meetingId } = Route.useParams();

	const handleSubmit = async (value: MeetingsRowType) => {
		meetings.update(meetingId, (draft) => {
			Object.assign(draft, value);
		});
		navigate({ to: "/meetings" });
	};

	const handleDelete = async () => {
		meetings.delete(meetingId);
		navigate({ to: "/meetings" });
	};

	const defaultValues: MeetingsRowType = { ...meeting };

	return (
		<div className="space-y-4">
			<MeetingsForm
				defaultValues={defaultValues}
				formLabel="Edit Meeting"
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
