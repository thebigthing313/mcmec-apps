import { eq, useLiveQuery } from "@tanstack/react-db";
import { employees, notices, noticeTypes } from "../lib/db";

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
					createdById: notice.created_by,
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

	const enriched = data.map((notice) => ({
		...notice,
		createdByName: notice.createdById
			? (employees.get(notice.createdById)?.display_name ?? null)
			: null,
	}));

	return { collection, data: enriched };
}
