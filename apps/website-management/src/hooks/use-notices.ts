import { eq, useLiveQuery } from "@tanstack/react-db";
import { notices, noticeTypes } from "../lib/db";

export function useNotices() {
	const { data, collection } = useLiveQuery((q) =>
		q
			.from({ notice: notices })
			.innerJoin({ notice_type: noticeTypes }, ({ notice, notice_type }) =>
				eq(notice.notice_type_id, notice_type.id),
			)
			.select(({ notice, notice_type }) => {
				return {
					content: notice.content,
					id: notice.id,
					isArchived: notice.is_archived,
					isPublished: notice.is_published,
					noticeDate: notice.notice_date,
					noticeType: notice_type?.name,
					noticeTypeId: notice.notice_type_id,
					title: notice.title,
				};
			}),
	);

	return { collection, data };
}
