/**
 * `notice_types` — the three commands of #134's vocabulary (W-1…3).
 *
 * A Notice Category is a grouping the Commission names (CONTEXT.md); the table is called
 * `notice_types` and the commands are not, because the glossary says "category" and the column
 * name is a fact about Postgres rather than about the domain.
 *
 * There is no lifecycle here — a category is created, renamed and deleted, and nothing else can
 * happen to it. That makes this the plain three-command shape: create, updateDetails, delete.
 *
 * `id` appears in no payload — it rides in the envelope and names the row the command is about.
 */
import z from "zod";
import { defineDomain } from "../command";

const website = defineDomain("website", "manage_website");
const command = website.table("notice_types");

const DetailFields = {
	// Nullable rather than optional: the form clears a description by sending null, and a
	// column that can hold null needs a way to be put back to it.
	description: z.string().nullable(),
	name: z.string().min(1),
} as const;

/** The delete command takes no fields — the envelope id is the whole request. */
const EmptyPayload = z.object({});

export const createNoticeCategory = command(
	"createNoticeCategory",
	z.object(DetailFields),
	{ creates: true },
);

/**
 * Partial, because the collection handler sends `mutation.changes`. The non-empty refinement is
 * what makes "an update that asks for nothing" a refusal.
 */
export const updateNoticeCategoryDetails = command(
	"updateNoticeCategoryDetails",
	z
		.object(DetailFields)
		.partial()
		.refine((v) => Object.keys(v).length > 0, {
			error: "no fields to update",
		}),
);

export const deleteNoticeCategory = command(
	"deleteNoticeCategory",
	EmptyPayload,
);

export const NOTICE_CATEGORY_COMMANDS = [
	createNoticeCategory,
	updateNoticeCategoryDetails,
	deleteNoticeCategory,
] as const;
