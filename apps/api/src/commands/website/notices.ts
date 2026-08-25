/**
 * Handlers for the seven `notices` commands.
 *
 * Each runs inside the request's shared transaction and refuses by throwing `CommandError`.
 * Note what a lifecycle handler is: a named row-scoped `set`, with the precondition (if any)
 * checked against stored state rather than against what the client sent.
 */
import type { notices as noticeCommands } from "@mcmec/domain";
import { eq } from "drizzle-orm";
import { notices } from "../../db/schema";
import { toColumnValues } from "../columns";
import {
	deleteRow,
	isForeignKeyViolation,
	NOT_FOUND,
	setFields,
} from "../rows";
import { CommandError, type CommandHandler } from "../types";

/** Days a legal notice must stay on the current-notices page before it may be archived. */
const RETENTION_DAYS = 7;

export const createNotice: CommandHandler<
	typeof noticeCommands.createNotice
> = async ({ payload, id, tx }) => {
	// The envelope id is honoured, so the optimistic row's key IS the committed row's id —
	// which is the divergence `data.ts` had by stripping it, and what makes a retried
	// create idempotent against the primary key instead of duplicating.
	await tx.insert(notices).values({
		id,
		isArchived: false,
		...toColumnValues(notices, payload),
	} as typeof notices.$inferInsert);
};

export const updateNoticeDetails: CommandHandler<
	typeof noticeCommands.updateNoticeDetails
> = async ({ payload, id, tx }) => {
	await setFields(tx, notices, id, toColumnValues(notices, payload));
};

export const publishNotice: CommandHandler<
	typeof noticeCommands.publishNotice
> = async ({ id, tx }) => {
	await setFields(tx, notices, id, { isPublished: true });
};

export const unpublishNotice: CommandHandler<
	typeof noticeCommands.unpublishNotice
> = async ({ id, tx }) => {
	await setFields(tx, notices, id, { isPublished: false });
};

/**
 * P.L. 2025 c.72 — a legal notice must remain on the current-notices page for seven days.
 *
 * This is the rule that could not be expressed against `PATCH /api/data/notices`: it is a
 * precondition on archiving and on nothing else. It lived as a non-blocking amber box in
 * `notice-form.tsx` until this command existed to carry it.
 */
export const archiveNotice: CommandHandler<
	typeof noticeCommands.archiveNotice
> = async ({ id, tx }) => {
	const [row] = await tx
		.select({ noticeDate: notices.noticeDate })
		.from(notices)
		.where(eq(notices.id, id));
	if (!row) throw NOT_FOUND;

	// Date-only prefix, then an explicit NaN guard. An unparseable notice date must refuse:
	// NaN compares false against every threshold, so the naive form would wave the statutory
	// rule through exactly when the stored data is least trustworthy.
	const posted = new Date(`${row.noticeDate.slice(0, 10)}T00:00:00Z`);
	if (Number.isNaN(posted.getTime())) {
		throw new CommandError(409, {
			error: "precondition_failed",
			message:
				"This notice has no readable posting date, so its seven-day retention " +
				"period cannot be checked. Fix the notice date before archiving.",
			reason: "unreadable_notice_date",
		});
	}

	const days = Math.floor((Date.now() - posted.getTime()) / 86_400_000);
	if (days < RETENTION_DAYS) {
		// A future-dated notice gives a negative day count, and "posted -3 days ago" is not a
		// sentence. Its retention period has not started, which is the thing worth saying.
		const posting =
			days < 0
				? "This notice is dated in the future, so its retention period has not started."
				: `This notice was posted ${days} day${days === 1 ? "" : "s"} ago.`;
		throw new CommandError(409, {
			error: "precondition_failed",
			message:
				`${posting} Per P.L. 2025, c.72, legal notices must remain on the current notices ` +
				`page for at least ${RETENTION_DAYS} days before archiving.`,
			reason: "retention_period",
		});
	}

	await setFields(tx, notices, id, { isArchived: true });
};

export const unarchiveNotice: CommandHandler<
	typeof noticeCommands.unarchiveNotice
> = async ({ id, tx }) => {
	await setFields(tx, notices, id, { isArchived: false });
};

export const deleteNotice: CommandHandler<
	typeof noticeCommands.deleteNotice
> = async ({ id, tx }) => {
	try {
		await deleteRow(tx, notices, id);
	} catch (e) {
		// A deleting handler owns the FK→409 mapping itself: the row is still referenced
		// (a notice_postings ledger entry), which is a conflict, not bad input.
		if (isForeignKeyViolation(e)) {
			throw new CommandError(409, {
				error: "conflict",
				message: "This notice is still referenced and cannot be deleted.",
				reason: "still_referenced",
			});
		}
		throw e;
	}
};
