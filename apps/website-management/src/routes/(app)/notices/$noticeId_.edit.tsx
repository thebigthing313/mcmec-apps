import { ErrorMessages } from "@mcmec/lib/constants/errors";
import type { NoticesRowType } from "@mcmec/supabase/db/notices";
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
import { NoticeForm } from "@/src/components/notice-form";
import { notices, noticeTypes } from "@/src/lib/db";
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

	const handleSubmit = async (value: NoticesRowType) => {
		const tx = notices.update(noticeId, (draft) => {
			Object.assign(draft, value);
		});
		toastOnError(tx, "Failed to update notice.");
		navigate({ to: "/notices" });
	};

	const handleDelete = async () => {
		const tx = notices.delete(noticeId);
		toastOnError(tx, "Failed to delete notice.");
		navigate({ to: "/notices" });
	};

	return (
		<div className="space-y-4" {...latchProps}>
			<NoticeForm
				categories={items}
				defaultValues={{
					content: notice.content,
					created_at: new Date(notice.created_at),
					id: notice.id,
					is_archived: notice.is_archived,
					is_published: notice.is_published,
					notice_date: new Date(notice.notice_date),
					notice_type_id: notice.notice_type_id,
					title: notice.title,
					updated_at: new Date(),
				}}
				formLabel="Edit Notice"
				key={seedKey}
				onSubmit={handleSubmit}
				submitLabel="Update"
			/>

			<div className="max-w-2xl">
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
