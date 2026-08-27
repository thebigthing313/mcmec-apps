import { PageHeader } from "@mcmec/ui/blocks/page-header";
import { Button } from "@mcmec/ui/components/button";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, Undo2, Upload } from "lucide-react";
import { NoticesTable } from "@/src/components/notices-table";
import { useNotices } from "@/src/hooks/use-notices";
import { notices } from "@/src/lib/db";
import { runLifecycle } from "@/src/lib/lifecycle";

export const Route = createFileRoute("/(app)/notices/")({
	component: RouteComponent,
	loader: () => {
		return { crumb: "Public Notices" };
	},
});

function RouteComponent() {
	const navigate = useNavigate();
	const { data: noticeList } = useNotices();
	const mappedData = noticeList?.map((notice) => ({
		id: notice.id,
		isArchived: notice.isArchived,
		isPublished: notice.isPublished,
		noticeDate: notice.noticeDate,
		noticeType: notice.noticeType,
		noticeTypeId: notice.noticeTypeId,
		title: notice.title,
	}));

	return (
		<div className="flex flex-col gap-2">
			<PageHeader
				actions={
					<Button onClick={() => navigate({ to: "/notices/create" })}>
						<Plus />
						Create New Notice
					</Button>
				}
				description="Dated public announcements, including the legal notices the Commission is required to post."
				title="Public Notices"
			/>
			<NoticesTable
				data={mappedData ?? []}
				// A shortcut, never the only way in: publishing is also on the detail view and in
				// the edit form (ADR 0001). Archive stays off the row — it is the one action that
				// can be refused, and the 409 reads better next to the notice it is about.
				rowActions={(notice) => [
					notice.isPublished
						? {
								icon: <Undo2 />,
								label: "Unpublish",
								onAct: () =>
									runLifecycle(notices, notice.id, {
										apply: (draft) => {
											draft.is_published = false;
										},
										command: "website.unpublishNotice",
										failure: "Failed to unpublish notice.",
									}),
							}
						: {
								icon: <Upload />,
								label: "Publish",
								onAct: () =>
									runLifecycle(notices, notice.id, {
										apply: (draft) => {
											draft.is_published = true;
										},
										command: "website.publishNotice",
										failure: "Failed to publish notice.",
									}),
							},
				]}
			/>
		</div>
	);
}
