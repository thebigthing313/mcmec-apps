/**
 * `notices` — the seven commands of #134's vocabulary (W-4…8).
 *
 * The lifecycle columns (`is_published`, `is_archived`) are omitted from `updateNoticeDetails`
 * on purpose: with them absent from the payload schema, a lifecycle column can only move
 * through a named command, so the split is enforced by construction rather than by discipline.
 *
 * `id` appears in no payload — it rides in the envelope and names the row the command is about.
 */
import { NoticesRowSchema } from "@mcmec/schemas/db/notices";
import z from "zod";
import { defineDomain } from "../command";

const website = defineDomain("website", "manage_website");

// The Drizzle column is `date` in string mode, so it wants 'YYYY-MM-DD' text, not a Date and
// not a timestamp. Postgres would accept a full ISO string and truncate it, but the handler
// reads the column back as `${noticeDate}T00:00:00Z` to check P.L. 2025 c.72 — and that
// concatenation on a stored timestamp yields Invalid Date, whose NaN day count compares false
// and waves the retention rule through. Truncate here so the column can only hold a date.
const NoticeDate = z.coerce
	.date()
	.transform((d) => d.toISOString().slice(0, 10));

const DetailFields = {
	content: NoticesRowSchema.shape.content,
	notice_date: NoticeDate,
	notice_type_id: NoticesRowSchema.shape.notice_type_id,
	title: z.string().min(5),
} as const;

/** The lifecycle commands take no fields — the envelope id is the whole request. */
const EmptyPayload = z.object({});

export const createNotice = website(
	"createNotice",
	z.object({
		...DetailFields,
		// Creation is not a transition, so a create may set initial state where the UI
		// genuinely offers the choice. `is_archived` is not offered — a notice is born active.
		is_published: z.boolean(),
	}),
	{ creates: true },
);

/**
 * Partial, because the collection handler sends `mutation.changes` — a title-only edit carries
 * one key. The non-empty refinement is what makes "an update that asks for nothing" a refusal.
 */
export const updateNoticeDetails = website(
	"updateNoticeDetails",
	z
		.object(DetailFields)
		.partial()
		.refine((v) => Object.keys(v).length > 0, {
			error: "no fields to update",
		}),
);

export const publishNotice = website("publishNotice", EmptyPayload);
export const unpublishNotice = website("unpublishNotice", EmptyPayload);
/** Precondition: P.L. 2025 c.72 — enforced in the handler, against stored state. */
export const archiveNotice = website("archiveNotice", EmptyPayload);
export const unarchiveNotice = website("unarchiveNotice", EmptyPayload);
export const deleteNotice = website("deleteNotice", EmptyPayload);

export const NOTICE_COMMANDS = [
	createNotice,
	updateNoticeDetails,
	publishNotice,
	unpublishNotice,
	archiveNotice,
	unarchiveNotice,
	deleteNotice,
] as const;
