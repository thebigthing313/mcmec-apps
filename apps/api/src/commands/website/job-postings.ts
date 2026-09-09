/**
 * Handlers for the seven `job_postings` commands.
 *
 * Every lifecycle handler here is a named row-scoped `set` with no precondition — job postings
 * carry no legal retention rule of the kind `archiveNotice` enforces. What the names buy on this
 * table is different: `published_at` stops being a date the client picks and becomes a timestamp
 * the server stamps, so "published" can no longer mean "someone typed a date in the past".
 */
import type { jobPostings as jobPostingCommands } from "@mcmec/domain";
import { jobPostings } from "../../db/schema";
import { toColumnValues } from "../columns";
import { deleteRow, setFields } from "../rows";
import type { CommandHandler } from "../types";

/**
 * Born a draft, and open. Neither lifecycle column is in the payload schema, so there is no
 * body a caller could send that would create an already-published posting.
 */
export const createJobPosting: CommandHandler<
	typeof jobPostingCommands.createJobPosting
> = async ({ payload, id, tx }) => {
	await tx.insert(jobPostings).values({
		id,
		isClosed: false,
		publishedAt: null,
		...toColumnValues(jobPostings, payload),
	} as typeof jobPostings.$inferInsert);
};

export const updateJobPostingDetails: CommandHandler<
	typeof jobPostingCommands.updateJobPostingDetails
> = async ({ payload, id, tx }) => {
	await setFields(tx, jobPostings, id, toColumnValues(jobPostings, payload));
};

/**
 * The server owns the timestamp.
 *
 * Under `PATCH /api/data/job_postings` this was a client-supplied date, which is what made
 * "pending" (a publish date in the future) a reachable state. Nothing new can enter it now —
 * `getJobPostingStatus` keeps the branch for rows written before this landed.
 */
export const publishJobPosting: CommandHandler<
	typeof jobPostingCommands.publishJobPosting
> = async ({ id, tx }) => {
	await setFields(tx, jobPostings, id, { publishedAt: new Date() });
};

/** Back to draft. The posting keeps no memory of when it was published — there is one column. */
export const unpublishJobPosting: CommandHandler<
	typeof jobPostingCommands.unpublishJobPosting
> = async ({ id, tx }) => {
	await setFields(tx, jobPostings, id, { publishedAt: null });
};

export const closeJobPosting: CommandHandler<
	typeof jobPostingCommands.closeJobPosting
> = async ({ id, tx }) => {
	await setFields(tx, jobPostings, id, { isClosed: true });
};

export const reopenJobPosting: CommandHandler<
	typeof jobPostingCommands.reopenJobPosting
> = async ({ id, tx }) => {
	await setFields(tx, jobPostings, id, { isClosed: false });
};

export const deleteJobPosting: CommandHandler<
	typeof jobPostingCommands.deleteJobPosting
> = async ({ id, tx }) => {
	// No FK→409 wrapper: nothing references `job_postings`, so a delete cannot be refused for
	// being still referenced. Add one here the day something does.
	await deleteRow(tx, jobPostings, id);
};
