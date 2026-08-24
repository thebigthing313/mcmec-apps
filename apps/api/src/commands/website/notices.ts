/**
 * Handlers for the seven `notices` commands.
 *
 * Each runs inside the request's shared transaction and refuses by throwing `CommandError`.
 * Note what a lifecycle handler is: a named row-scoped `set`, with the precondition (if any)
 * checked against stored state rather than against what the client sent.
 */
import type { notices as noticeCommands } from "@mcmec/domain";
import { eq } from "drizzle-orm";
import type { Tx } from "../../actor";
import { notices } from "../../db/schema";
import { toColumnValues } from "../columns";
import { CommandError, type CommandHandler } from "../types";

const NOT_FOUND = new CommandError(404, { error: "not found" });

/** Days a legal notice must stay on the current-notices page before it may be archived. */
const RETENTION_DAYS = 7;

async function setFields(tx: Tx, id: string, values: Record<string, unknown>) {
	const rows = await tx
		.update(notices)
		.set(values)
		.where(eq(notices.id, id))
		.returning({ id: notices.id });
	if (rows.length === 0) throw NOT_FOUND;
}

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
	await setFields(tx, id, toColumnValues(notices, payload));
};

export const publishNotice: CommandHandler<
	typeof noticeCommands.publishNotice
> = async ({ id, tx }) => {
	await setFields(tx, id, { isPublished: true });
};

export const unpublishNotice: CommandHandler<
	typeof noticeCommands.unpublishNotice
> = async ({ id, tx }) => {
	await setFields(tx, id, { isPublished: false });
};

/**
 * P.L. 2025 c.72 — a legal notice must remain on the current-notices page for seven days.
 *
 * This is the rule that could not be expressed against `PATCH /api/data/notices`: it is a
 * precondition on archiving and on nothing else. Today it is a non-blocking amber box in
 * `notice-form.tsx`, invisible to the server.
 */
export const archiveNotice: CommandHandler<
	typeof noticeCommands.archiveNotice
> = async ({ id, tx }) => {
	const [row] = await tx
		.select({ noticeDate: notices.noticeDate })
		.from(notices)
		.where(eq(notices.id, id));
	if (!row) throw NOT_FOUND;

	const posted = new Date(`${row.noticeDate}T00:00:00Z`);
	const days = Math.floor((Date.now() - posted.getTime()) / 86_400_000);
	if (days < RETENTION_DAYS) {
		throw new CommandError(409, {
			error: "precondition_failed",
			message:
				`This notice was posted ${days} day${days === 1 ? "" : "s"} ago. Per P.L. 2025, c.72, ` +
				`legal notices must remain on the current notices page for at least ${RETENTION_DAYS} days ` +
				`before archiving.`,
			reason: "retention_period",
		});
	}

	await setFields(tx, id, { isArchived: true });
};

export const unarchiveNotice: CommandHandler<
	typeof noticeCommands.unarchiveNotice
> = async ({ id, tx }) => {
	await setFields(tx, id, { isArchived: false });
};

export const deleteNotice: CommandHandler<
	typeof noticeCommands.deleteNotice
> = async ({ id, tx }) => {
	try {
		const rows = await tx
			.delete(notices)
			.where(eq(notices.id, id))
			.returning({ id: notices.id });
		if (rows.length === 0) throw NOT_FOUND;
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

function isForeignKeyViolation(e: unknown): boolean {
	return (
		typeof e === "object" &&
		e !== null &&
		"code" in e &&
		(e as { code?: string }).code === "23503"
	);
}
