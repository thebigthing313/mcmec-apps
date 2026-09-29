/**
 * Website Management's `validateSearch` functions, and the filter values they accept.
 *
 * Here rather than beside the screens in `src/apps/website-management/`, because a route's
 * `validateSearch` is never code-split: whatever it imports lands in the entry chunk, and
 * `pnpm check-bundle` refuses App code there. So this module imports no component and nothing
 * under `src/apps/` — only the component-free half of the record index and types. The screens
 * import their filter values from here, so the URL and the Select cannot offer different sets.
 */
import type { SprayScheduleStatus } from "@mcmec/schemas/db/spray-schedules";
import {
	type RecordIndexSearch,
	validateRecordIndexSearch,
} from "@mcmec/ui/blocks/record-index-search";

/**
 * A Notice's state as the register filters it, derived rather than stored. "Pending" is a
 * Notice Published against a future date: committed, but not yet on the public site.
 */
export const NOTICE_STATUSES = [
	"Draft",
	"Pending",
	"Published",
	"Archived",
] as const;
export type NoticeStatus = (typeof NOTICE_STATUSES)[number];

export type NoticesSearch = Partial<RecordIndexSearch> & {
	status?: NoticeStatus;
};

export function validateNoticesSearch(
	raw: Record<string, unknown>,
): NoticesSearch {
	return validateRecordIndexSearch(raw, (r) =>
		NOTICE_STATUSES.includes(r.status as NoticeStatus)
			? { status: r.status as NoticeStatus }
			: {},
	);
}

/**
 * The four states a Spray Mission can be in, in the order the season runs them. Out of season
 * the newest-first sort opens on a wall of Completed missions, which is why the filter exists.
 */
export const MISSION_STATUSES: SprayScheduleStatus[] = [
	"scheduled",
	"delayed",
	"completed",
	"cancelled",
];

export type MissionsSearch = Partial<RecordIndexSearch> & {
	status?: SprayScheduleStatus;
};

export function validateMissionsSearch(
	raw: Record<string, unknown>,
): MissionsSearch {
	return validateRecordIndexSearch(raw, (r) =>
		MISSION_STATUSES.includes(r.status as SprayScheduleStatus)
			? { status: r.status as SprayScheduleStatus }
			: {},
	);
}

/**
 * The two states a Public Request is shown in. `CONTEXT.md`: a Public Request is either New or
 * Resolved. A legacy `in_progress` row displays, and filters, as New.
 */
export const REQUEST_STATUSES = ["new", "resolved"] as const;
export type DisplayRequestStatus = (typeof REQUEST_STATUSES)[number];

/** The "no filter" value of the Public Requests Selects. */
export const ALL_REQUESTS = "all";

export type RequestsSearch = Partial<RecordIndexSearch> & {
	type?: string;
	status?: DisplayRequestStatus;
};

export function validateRequestsSearch(
	raw: Record<string, unknown>,
): RequestsSearch {
	return validateRecordIndexSearch(raw, (r) => ({
		...(typeof r.type === "string" && r.type !== ALL_REQUESTS
			? { type: r.type }
			: {}),
		...(r.status === "new" || r.status === "resolved"
			? { status: r.status }
			: {}),
	}));
}
