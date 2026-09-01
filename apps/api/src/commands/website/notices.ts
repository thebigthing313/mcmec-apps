/**
 * Handlers for the seven `notices` commands.
 *
 * Each runs inside the request's shared transaction and refuses by throwing `CommandError`.
 * Note what a lifecycle handler is: a named row-scoped `set`, with the precondition (if any)
 * checked against stored state rather than against what the client sent.
 *
 * Two of them also append to the `notice_postings` proof-of-posting ledger, because two of them
 * can move a notice from unpublished to published — see `appendPosting`.
 */
import type { notices as noticeCommands } from "@mcmec/domain";
import { eq } from "drizzle-orm";
import type { Tx } from "../../actor";
import { noticePostings, notices, noticeTypes } from "../../db/schema";
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

/**
 * Appends the proof-of-posting row for one unpublished→published transition.
 *
 * P.L. 2025 c.72 makes the website MCMEC's primary method of publishing legal notices, so what
 * was published and when is evidence. `notice_postings` is append-only for that reason — the
 * `app_rw` role has INSERT and SELECT but no UPDATE or DELETE — and is excluded from the
 * seven-year audit purge. This is the only thing that writes it.
 *
 * Three things it deliberately does not do:
 *
 * - It does not read the command payload. The canonical save-and-publish is a two-intent
 *   envelope (`updateNoticeDetails` then `publishNotice`), `publishNotice`'s payload is empty
 *   by definition, and intents run in the order the client sent them — so the only source that
 *   is correct under every ordering is the notice row as it stands in this transaction.
 * - It does not look for an existing row. Unpublish-then-republish is two distinct periods of
 *   public availability and both are evidence, which is what the `(notice_id, posted_at)`
 *   index is for.
 * - It does not defer to an `AfterCommit` thunk. The ledger entry belongs to the write that
 *   caused it, so a failed notice write must leave no posting behind.
 *
 * The notice type's resolved name is frozen beside its id: the name keeps the record readable
 * if the type is later renamed, the id keeps it machine-linkable either way.
 */
async function appendPosting(
	tx: Tx,
	noticeId: string,
	postedBy: string,
): Promise<void> {
	// An inner join, not a second query: `notice_type_id` is NOT NULL behind a restricting
	// foreign key, so the type row is there by construction.
	const [row] = await tx
		.select({
			content: notices.content,
			noticeDate: notices.noticeDate,
			noticeType: noticeTypes.name,
			noticeTypeId: notices.noticeTypeId,
			title: notices.title,
		})
		.from(notices)
		.innerJoin(noticeTypes, eq(noticeTypes.id, notices.noticeTypeId))
		.where(eq(notices.id, noticeId));
	if (!row) throw NOT_FOUND;

	await tx.insert(noticePostings).values({
		noticeId,
		postedBy,
		snapshot: {
			content: row.content,
			notice_date: row.noticeDate,
			notice_type: row.noticeType,
			notice_type_id: row.noticeTypeId,
			title: row.title,
		},
	});
}

export const createNotice: CommandHandler<
	typeof noticeCommands.createNotice
> = async ({ payload, id, session, tx }) => {
	// The envelope id is honoured, so the optimistic row's key IS the committed row's id —
	// which is the divergence `data.ts` had by stripping it, and what makes a retried
	// create idempotent against the primary key instead of duplicating.
	await tx.insert(notices).values({
		id,
		isArchived: false,
		...toColumnValues(notices, payload),
	} as typeof notices.$inferInsert);

	// Creating a notice already published IS the transition — there is no earlier moment at
	// which it could have been recorded.
	if (payload.is_published) await appendPosting(tx, id, session.userId);
};

/**
 * No ledger row, and no transition check to decide that: the domain omits the lifecycle
 * columns from this payload schema, so `is_published` cannot move through here at all.
 */
export const updateNoticeDetails: CommandHandler<
	typeof noticeCommands.updateNoticeDetails
> = async ({ payload, id, tx }) => {
	await setFields(tx, notices, id, toColumnValues(notices, payload));
};

/**
 * Sets the column, and appends a ledger row only on a genuine transition.
 *
 * The stored `is_published` is read first because `setFields` has no state check by design, so
 * a hand-written envelope can publish an already-published notice. That is a no-op as far as
 * the public site is concerned, but appending for it would forge a second proof-of-posting for
 * a period of availability that never ended.
 */
export const publishNotice: CommandHandler<
	typeof noticeCommands.publishNotice
> = async ({ id, session, tx }) => {
	const [row] = await tx
		.select({ isPublished: notices.isPublished })
		.from(notices)
		.where(eq(notices.id, id));
	if (!row) throw NOT_FOUND;

	await setFields(tx, notices, id, { isPublished: true });
	if (!row.isPublished) await appendPosting(tx, id, session.userId);
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
