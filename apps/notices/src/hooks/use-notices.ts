import { eq, useLiveQuery } from "@tanstack/react-db";
import { notice_types } from "../lib/collections/notice_types";
import { notices } from "../lib/collections/notices";
import { profiles } from "../lib/collections/profiles";

export function useNotices() {
	return useLiveQuery((q) =>
		q
			.from({ notice: notices })
			.innerJoin({ notice_type: notice_types }, ({ notice, notice_type }) =>
				eq(notice.notice_type_id, notice_type.id),
			)
			.join({ profile: profiles }, ({ notice, profile }) =>
				eq(notice.created_by, profile.user_id),
			)
			.select(({ notice, notice_type, profile }) => {
				return {
					content: notice.content,
					createdById: notice.created_by,
					createdByName: profile?.display_name,
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
