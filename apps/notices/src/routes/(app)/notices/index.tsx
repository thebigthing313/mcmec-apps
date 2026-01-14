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
		id: notice.id,
		title: notice.title,
		noticeTypeId: notice.noticeTypeId,
		noticeType: notice.noticeType,
		noticeDate: notice.noticeDate,
		creator: notice.createdByName,
		isPublished: notice.isPublished,
	}));

	return (
		<div className="flex flex-col gap-2">
			<Button
				variant="default"
				onClick={() => navigate({ to: "/notices/create" })}
			>
				<Plus />
				Create New Notice
			</Button>
			<NoticesTable data={mappedData ?? []} />
		</div>
	);
}
