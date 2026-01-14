import { Button } from "@mcmec/ui/components/button";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { NoticesTable } from "@/src/components/notices-table";
import { useNotices } from "@/src/hooks/use-notices";

export const Route = createFileRoute("/(app)/notices/")({
	component: RouteComponent,
	loader: () => {
		return { crumb: "Public Notices Index" };
	},
});

function RouteComponent() {
	const navigate = useNavigate();
	const { data: notices } = useNotices();
	const mappedData = notices?.map((notice) => ({
		creator: notice.createdByName,
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
			<Button
				onClick={() => navigate({ to: "/notices/create" })}
				variant="default"
			>
				<Plus />
				Create New Notice
			</Button>
			<NoticesTable data={mappedData ?? []} />
		</div>
	);
}
