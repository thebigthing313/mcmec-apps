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
					id: notice.id,
					title: notice.title,
					content: notice.content,
					createdById: notice.created_by,
					createdByName: profile?.display_name,
					noticeTypeId: notice.notice_type_id,
					noticeType: notice_type?.name,
					noticeDate: notice.notice_date,
					isPublished: notice.is_published,
				};
			}),
	);
}

export function usePublishedNotices() {
	const { collection: allNotices } = useNotices();
	return useLiveQuery((q) =>
		q
			.from({ notice: allNotices })
			.where(({ notice }) => eq(notice.isPublished, true))
			.select(({ notice }) => notice),
	);
}

export function useNoticesByType(noticeTypeId: string) {
	const { collection: allNotices } = useNotices();
	return useLiveQuery(
		(q) =>
			q
				.from({ notice: allNotices })
				.where(({ notice }) => eq(notice.noticeTypeId, noticeTypeId))
				.select(({ notice }) => notice),
		[noticeTypeId],
	);
}
