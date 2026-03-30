import { eq, useLiveQuery } from "@tanstack/react-db";
import { employees, notices, noticeTypes } from "../lib/db";

export function useNotices() {
	return useLiveQuery((q) =>
		q
			.from({ notice: notices })
			.innerJoin({ notice_type: noticeTypes }, ({ notice, notice_type }) =>
				eq(notice.notice_type_id, notice_type.id),
			)
			.join({ employee: employees }, ({ notice, employee }) =>
				eq(notice.created_by, employee.user_id),
			)
			.select(({ notice, notice_type, employee }) => {
				return {
					content: notice.content,
					createdById: notice.created_by,
					createdByName: employee?.display_name,
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
}
