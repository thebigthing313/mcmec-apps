import { PublicNoticeCard } from "@mcmec/ui/blocks/public-notice-card";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import { notice_types } from "../lib/collections/notice_types";
import { notices } from "../lib/collections/notices";

export const Route = createFileRoute("/notices")({
	component: RouteComponent,
	loader: async () => {
		await Promise.all([notices.preload(), notice_types.preload()]);
	},
});

function RouteComponent() {
	const { data: noticesToShow } = useLiveQuery((q) =>
		q
			.from({ notice: notices })
			.innerJoin({ notice_type: notice_types }, ({ notice, notice_type }) =>
				eq(notice.notice_type_id, notice_type.id),
			)
			.where(({ notice }) => eq(notice.is_archived, false))
			.orderBy(({ notice }) => notice.notice_date, "desc")
			.orderBy(({ notice }) => notice.title, "asc")
			.select(({ notice, notice_type }) => ({
				content: notice.content,
				id: notice.id,
				isArchived: notice.is_archived,
				isPublished: notice.is_published,
				noticeDate: notice.notice_date,
				title: notice.title,
				type: notice_type.name,
			})),
	);
	return (
		<div className="mx-auto flex max-w-2xl flex-col gap-2">
			<h3 className="w-full text-center font-bold text-2xl">
				Current Legal Notices
			</h3>
			{noticesToShow?.map((notice) => (
				<PublicNoticeCard
					content={notice.content}
					isArchived={notice.isArchived}
					isPublished={notice.isPublished}
					key={notice.id}
					noticeDate={notice.noticeDate}
					title={notice.title}
					type={notice.type}
				/>
			))}
		</div>
	);
}
