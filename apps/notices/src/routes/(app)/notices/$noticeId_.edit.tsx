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
import { useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import { NoticeForm } from "@/src/components/notice-form";
import { notice_types } from "@/src/lib/collections/notice_types";
import { notices } from "@/src/lib/collections/notices";

export const Route = createFileRoute("/(app)/notices/$noticeId_/edit")({
	component: RouteComponent,
	loader: async ({ params }) => {
		await Promise.all([notices.preload(), notice_types.preload()]);
		const notice = notices.get(params.noticeId);
		if (!notice) {
			throw new Error("Notice not found");
		}
		return { crumb: "Edit", notice };
	},
});

function RouteComponent() {
	const navigate = Route.useNavigate();
	const { notice } = Route.useLoaderData();
	const { noticeId } = Route.useParams();

	const { data: categories } = useLiveQuery((q) =>
		q
			.from({ notice_type: notice_types })
			.orderBy(({ notice_type }) => notice_type.name),
	);

	const items = categories.map((category) => ({
		label: category.name,
		value: category.id,
	}));

	const handleSubmit = async (value: NoticesRowType) => {
		notices.update(noticeId, (draft) => {
			Object.assign(draft, value);
		});
		navigate({ to: "/notices" });
	};

	const handleDelete = async () => {
		notices.delete(noticeId);
		navigate({ to: "/notices" });
	};

	return (
		<div className="space-y-4">
			<NoticeForm
				categories={items}
				defaultValues={{
					content: notice.content,
					created_at: new Date(notice.created_at),
					created_by: notice.created_by,
					id: notice.id,
					is_archived: notice.is_archived,
					is_published: notice.is_published,
					notice_date: new Date(notice.notice_date),
					notice_type_id: notice.notice_type_id,
					title: notice.title,
					updated_at: new Date(),
					updated_by: null,
				}}
				formLabel="Edit Notice"
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
