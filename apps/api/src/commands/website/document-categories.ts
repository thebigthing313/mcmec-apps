/**
 * Handlers for the three `document_types` commands.
 *
 * The same shape as `notice-categories`, against `documents` instead of `notices`. Kept as its
 * own module for the reason the definitions are: a shared "category handler" would make one
 * table's delete rule the other's by construction.
 */
import type { documentCategories as documentCategoryCommands } from "@mcmec/domain";
import { documentTypes } from "../../db/schema";
import { toColumnValues } from "../columns";
import { deleteRow, isForeignKeyViolation, setFields } from "../rows";
import { CommandError, type CommandHandler } from "../types";

export const createDocumentCategory: CommandHandler<
	typeof documentCategoryCommands.createDocumentCategory
> = async ({ payload, id, tx }) => {
	await tx.insert(documentTypes).values({
		id,
		...toColumnValues(documentTypes, payload),
	} as typeof documentTypes.$inferInsert);
};

export const updateDocumentCategoryDetails: CommandHandler<
	typeof documentCategoryCommands.updateDocumentCategoryDetails
> = async ({ payload, id, tx }) => {
	await setFields(
		tx,
		documentTypes,
		id,
		toColumnValues(documentTypes, payload),
	);
};

export const deleteDocumentCategory: CommandHandler<
	typeof documentCategoryCommands.deleteDocumentCategory
> = async ({ id, tx }) => {
	try {
		await deleteRow(tx, documentTypes, id);
	} catch (e) {
		// `documents.document_type_id` is `on delete restrict`.
		if (isForeignKeyViolation(e)) {
			throw new CommandError(409, {
				error: "conflict",
				message:
					"This category still has documents in it and cannot be deleted. " +
					"Move or delete those documents first.",
				reason: "still_referenced",
			});
		}
		throw e;
	}
};
