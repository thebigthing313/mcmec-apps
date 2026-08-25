/**
 * `job_postings` — the seven commands of #134's vocabulary.
 *
 * These live in `website`, not `employees`: a job posting is content published to the public
 * site, and the fact that HR writes the words does not make the table HR's. That placement is
 * the whole reason #145 moves the authoring screens out of `apps/hr` — the permission follows
 * the domain, and the frontend follows the permission.
 *
 * The lifecycle columns are `published_at` and `is_closed`, and both are omitted from
 * `updateJobPostingDetails`. `published_at` is the interesting one: today the form offers it as
 * a user-picked date whose emptiness MEANS draft ("leave empty for draft"), so "publish" is
 * spelled as a date entry. Naming the command makes it an action, and the server owns the
 * timestamp.
 *
 * `id` appears in no payload — it rides in the envelope and names the row the command is about.
 */
import z from "zod";
import { defineDomain } from "../command";

const website = defineDomain("website", "manage_website");

/**
 * A Tiptap document. The row schema types this `z.any()`, which would let an update send
 * `content: null` into a NOT NULL column; an object is the narrowest true statement we can
 * make about it without teaching the domain package Tiptap's node grammar.
 */
const Content = z.record(z.string(), z.unknown());

const DetailFields = {
	content: Content,
	title: z.string().min(1),
} as const;

/** The lifecycle commands take no fields — the envelope id is the whole request. */
const EmptyPayload = z.object({});

/**
 * Always a draft. Unlike `createNotice` — which may choose its initial publish state because
 * the UI genuinely offers it — there is no publish switch here to preserve: publishing stamps a
 * server timestamp, and a create cannot stamp one it was not asked for.
 */
export const createJobPosting = website(
	"createJobPosting",
	z.object(DetailFields),
	{
		creates: true,
	},
);

/**
 * Partial, because the collection handler sends `mutation.changes`. The non-empty refinement is
 * what makes "an update that asks for nothing" a refusal.
 */
export const updateJobPostingDetails = website(
	"updateJobPostingDetails",
	z
		.object(DetailFields)
		.partial()
		.refine((v) => Object.keys(v).length > 0, {
			error: "no fields to update",
		}),
);

/** Stamps `published_at = now()` server-side — the client no longer picks the date. */
export const publishJobPosting = website("publishJobPosting", EmptyPayload);
export const unpublishJobPosting = website("unpublishJobPosting", EmptyPayload);
export const closeJobPosting = website("closeJobPosting", EmptyPayload);
export const reopenJobPosting = website("reopenJobPosting", EmptyPayload);
export const deleteJobPosting = website("deleteJobPosting", EmptyPayload);

export const JOB_POSTING_COMMANDS = [
	createJobPosting,
	updateJobPostingDetails,
	publishJobPosting,
	unpublishJobPosting,
	closeJobPosting,
	reopenJobPosting,
	deleteJobPosting,
] as const;
