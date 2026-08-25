import { ErrorMessages } from "@mcmec/lib/constants/errors";
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
import {
	NoticeForm,
	type NoticeFormValues,
} from "@/src/components/notice-form";
import { intents, notices, noticeTypes } from "@/src/lib/db";
import { toastOnError } from "@/src/lib/toast-on-error";
import { rowVersion, useFormSeed } from "@/src/lib/use-form-seed";

export const Route = createFileRoute("/(app)/notices/$noticeId_/edit")({
	component: RouteComponent,
	loader: async ({ params }) => {
		await Promise.all([notices.preload(), noticeTypes.preload()]);
		const notice = notices.get(params.noticeId);
		if (!notice) {
			throw new Error(ErrorMessages.DATABASE.RECORD_NOT_AVAILABLE);
		}
		return { crumb: "Edit", notice };
	},
});

function RouteComponent() {
	const navigate = Route.useNavigate();
	const { notice: loadedNotice } = Route.useLoaderData();
	const { noticeId } = Route.useParams();

	// Seed from the live row, not the loader's one-shot read — see use-form-seed.ts.
	const { data: liveNotices } = useLiveQuery(
		(q) =>
			q
				.from({ notice: notices })
				.where(({ notice }) => eq(notice.id, noticeId)),
		[noticeId],
	);
	const notice = liveNotices[0] ?? loadedNotice;
	const { seedKey, latchProps } = useFormSeed(rowVersion(notice));

	const { data: categories } = useLiveQuery((q) =>
		q
			.from({ notice_type: noticeTypes })
			.orderBy(({ notice_type }) => notice_type.name),
	);

	const items = categories.map((category) => ({
		label: category.name,
		value: category.id,
	}));

	const handleSubmit = async (value: NoticeFormValues) => {
		const tx = notices.update(
			noticeId,
			intents("website.updateNoticeDetails"),
			(draft) => {
				draft.content = value.content;
				draft.notice_date = value.notice_date;
				draft.notice_type_id = value.notice_type_id;
				draft.title = value.title;
			},
		);
		toastOnError(tx, "Failed to update notice.");
		navigate({ to: "/notices" });
	};

	// One lifecycle action: the draft says what the user sees change, the intent says what they
	// meant. The audit row gets the name, not an inferred boolean flip.
	const togglePublished = () => {
		const publishing = !notice.is_published;
		const tx = notices.update(
			noticeId,
			intents(publishing ? "website.publishNotice" : "website.unpublishNotice"),
			(draft) => {
				draft.is_published = publishing;
			},
		);
		toastOnError(
			tx,
			publishing ? "Failed to publish notice." : "Failed to unpublish notice.",
		);
	};

	// The server owns P.L. 2025 c.72 now, so this button does not need to know the rule. A
	// refusal comes back as a 409 whose message is written for the person who clicked.
	const toggleArchived = () => {
		const archiving = !notice.is_archived;
		const tx = notices.update(
			noticeId,
			intents(archiving ? "website.archiveNotice" : "website.unarchiveNotice"),
			(draft) => {
				draft.is_archived = archiving;
			},
		);
		toastOnError(
			tx,
			archiving ? "Failed to archive notice." : "Failed to unarchive notice.",
		);
	};

	const handleDelete = async () => {
		const tx = notices.delete(noticeId, intents("website.deleteNotice"));
		toastOnError(tx, "Failed to delete notice.");
		navigate({ to: "/notices" });
	};

	return (
		<div className="space-y-4" {...latchProps}>
			<NoticeForm
				categories={items}
				defaultValues={{
					content: notice.content,
					notice_date: new Date(notice.notice_date),
					notice_type_id: notice.notice_type_id,
					title: notice.title,
				}}
				formLabel="Edit Notice"
				key={seedKey}
				mode="edit"
				onSubmit={handleSubmit}
				submitLabel="Update"
			/>

			<div className="max-w-2xl space-y-2">
				<div className="flex gap-2">
					<Button
						className="flex-1"
						onClick={togglePublished}
						variant="outline"
					>
						{notice.is_published ? "Unpublish" : "Publish"}
					</Button>
					<Button className="flex-1" onClick={toggleArchived} variant="outline">
						{notice.is_archived ? "Unarchive" : "Archive"}
					</Button>
				</div>

				<AlertDialog>
					<AlertDialogTrigger asChild>
						<Button className="w-full" variant="destructive">
							Delete Notice
						</Button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
							<AlertDialogDescription>
								This action cannot be undone. This will permanently delete the
								notice "{notice.title}".
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
