/**
 * Handlers for the seven `job_postings` commands.
 *
 * Every lifecycle handler here is a named row-scoped `set` with no precondition — job postings
 * carry no legal retention rule of the kind `archiveNotice` enforces. What the names buy on this
 * table is different: `published_at` stops being a date the client picks and becomes a timestamp
 * the server stamps, so "published" can no longer mean "someone typed a date in the past".
 */
import type { jobPostings as jobPostingCommands } from "@mcmec/domain";
import { eq } from "drizzle-orm";
import type { Tx } from "../../actor";
import { jobPostings } from "../../db/schema";
import { toColumnValues } from "../columns";
import { CommandError, type CommandHandler } from "../types";

const NOT_FOUND = new CommandError(404, { error: "not found" });

async function setFields(tx: Tx, id: string, values: Record<string, unknown>) {
	const rows = await tx
		.update(jobPostings)
		.set(values)
		.where(eq(jobPostings.id, id))
		.returning({ id: jobPostings.id });
	if (rows.length === 0) throw NOT_FOUND;
}

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
	await setFields(tx, id, toColumnValues(jobPostings, payload));
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
	await setFields(tx, id, { publishedAt: new Date() });
};

/** Back to draft. The posting keeps no memory of when it was published — there is one column. */
export const unpublishJobPosting: CommandHandler<
	typeof jobPostingCommands.unpublishJobPosting
> = async ({ id, tx }) => {
	await setFields(tx, id, { publishedAt: null });
};

export const closeJobPosting: CommandHandler<
	typeof jobPostingCommands.closeJobPosting
> = async ({ id, tx }) => {
	await setFields(tx, id, { isClosed: true });
};

export const reopenJobPosting: CommandHandler<
	typeof jobPostingCommands.reopenJobPosting
> = async ({ id, tx }) => {
	await setFields(tx, id, { isClosed: false });
};

export const deleteJobPosting: CommandHandler<
	typeof jobPostingCommands.deleteJobPosting
> = async ({ id, tx }) => {
	const rows = await tx
		.delete(jobPostings)
		.where(eq(jobPostings.id, id))
		.returning({ id: jobPostings.id });
	if (rows.length === 0) throw NOT_FOUND;
};
