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
		const notice = await notices.get(params.noticeId);
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
				defaultValues={{
					id: notice.id,
					notice_type_id: notice.notice_type_id,
					title: notice.title,
					notice_date: new Date(notice.notice_date),
					content: notice.content,
					is_published: notice.is_published,
					created_at: new Date(notice.created_at),
					created_by: notice.created_by,
					updated_at: new Date(),
					updated_by: null,
				}}
				onSubmit={handleSubmit}
				categories={items}
				formLabel="Edit Notice"
				submitLabel="Update"
			/>

			<div className="max-w-2xl">
				<AlertDialog>
					<AlertDialogTrigger asChild>
						<Button variant="destructive" className="w-full">
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
