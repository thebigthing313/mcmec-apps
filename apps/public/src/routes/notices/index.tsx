import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { NoticeFeed } from "../../components/notice-feed";
import {
	noticesQueryOptions,
	noticeTypesQueryOptions,
} from "../../lib/queries";

export const Route = createFileRoute("/notices/")({
	component: RouteComponent,
	loader: async ({ context }) => {
		await Promise.all([
			context.queryClient.ensureQueryData(noticesQueryOptions()),
			context.queryClient.ensureQueryData(noticeTypesQueryOptions()),
		]);
	},
});

function RouteComponent() {
	const { data: notices } = useSuspenseQuery(noticesQueryOptions());
	const { data: noticeTypes } = useSuspenseQuery(noticeTypesQueryOptions());

	// Create a map for quick lookup of notice types
	const noticeTypesMap = new Map(
		noticeTypes.map((type) => [type.id, type.name]),
	);

	// Filter and transform notices
	const noticesToShow = notices
		.filter((notice) => !notice.is_archived)
		.sort((a, b) => {
			// Sort by notice_date descending, then by title ascending
			const dateCompare =
				new Date(b.notice_date).getTime() - new Date(a.notice_date).getTime();
			return dateCompare !== 0 ? dateCompare : a.title.localeCompare(b.title);
		})
		.map((notice) => ({
			content: notice.content,
			id: notice.id,
			isArchived: notice.is_archived,
			isPublished: notice.is_published,
			noticeDate: notice.notice_date,
			title: notice.title,
			type: noticeTypesMap.get(notice.notice_type_id) || "Unknown",
		}));

	return (
		<div className="flex flex-col gap-4">
			<article className="prose lg:prose-xl mb-8 max-w-none">
				<h1>Current Legal Notices</h1>
				<p>
					This website and the public notices contained herein are maintained in
					accordance with P.L. 2025, c.72. The Middlesex County Mosquito
					Extermination Commission has designated this digital platform as its
					official primary method for the publication of legal notices,
					replacing or supplementing traditional newspaper advertisements as
					permitted by New Jersey law.
				</p>
			</article>
			<NoticeFeed notices={noticesToShow} />
		</div>
	);
}
