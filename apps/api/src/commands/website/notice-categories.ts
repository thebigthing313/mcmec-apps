/**
 * Handlers for the three `notice_types` commands.
 *
 * The plain shape: an insert honouring the envelope id, a row-scoped `set`, and a delete that
 * maps the FK restriction to a 409. No lifecycle columns, so no precondition beyond the one
 * Postgres already enforces.
 */
import type { noticeCategories as noticeCategoryCommands } from "@mcmec/domain";
import { noticeTypes } from "../../db/schema";
import { toColumnValues } from "../columns";
import { deleteRow, isForeignKeyViolation, setFields } from "../rows";
import { CommandError, type CommandHandler } from "../types";

export const createNoticeCategory: CommandHandler<
	typeof noticeCategoryCommands.createNoticeCategory
> = async ({ payload, id, tx }) => {
	await tx.insert(noticeTypes).values({
		id,
		...toColumnValues(noticeTypes, payload),
	} as typeof noticeTypes.$inferInsert);
};

export const updateNoticeCategoryDetails: CommandHandler<
	typeof noticeCategoryCommands.updateNoticeCategoryDetails
> = async ({ payload, id, tx }) => {
	await setFields(tx, noticeTypes, id, toColumnValues(noticeTypes, payload));
};

export const deleteNoticeCategory: CommandHandler<
	typeof noticeCategoryCommands.deleteNoticeCategory
> = async ({ id, tx }) => {
	try {
		await deleteRow(tx, noticeTypes, id);
	} catch (e) {
		// `notices.notice_type_id` is `on delete restrict`, so a category still in use refuses
		// here. The categories screen disables the button when its notice count is above zero;
		// this is the same rule enforced where it cannot be raced, and the sentence names what
		// is holding the row so the person who clicked knows what to do about it.
		if (isForeignKeyViolation(e)) {
			throw new CommandError(409, {
				error: "conflict",
				message:
					"This category still has notices in it and cannot be deleted. " +
					"Move or delete those notices first.",
				reason: "still_referenced",
			});
		}
		throw e;
	}
};
