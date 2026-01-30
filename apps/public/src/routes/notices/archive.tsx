import { eq, useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import { notice_types } from "@/src/lib/collections/notice_types";
import { notices } from "@/src/lib/collections/notices";
import { NoticeFeed } from "../../components/notice-feed";

export const Route = createFileRoute("/notices/archive")({
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
			.where(({ notice }) => eq(notice.is_archived, true))
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
		<div className="mx-auto w-full max-w-7xl p-4">
			<article className="prose lg:prose-xl mb-8 max-w-none">
				<h1>Archived Legal Notices</h1>
				<p>
					This website and the public notices contained herein are maintained in
					accordance with P.L. 2025, c.72. The Middlesex County Mosquito
					Extermination Commission has designated this digital platform as its
					official primary method for the publication of legal notices,
					replacing or supplementing traditional newspaper advertisements as
					permitted by New Jersey law.
				</p>
			</article>
			<NoticeFeed notices={noticesToShow || []} />
		</div>
	);
}
