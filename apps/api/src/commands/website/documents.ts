/**
 * Handlers for the five `documents` commands.
 *
 * Each runs inside the request's shared transaction and refuses by throwing `CommandError`.
 * Note what a lifecycle handler is: a named row-scoped `set`, with the precondition (if any)
 * checked against stored state rather than against what the client sent — and `documents` has
 * none. A document is a link to a published artifact; nothing gates when it may go up.
 */
import type { documents as documentCommands } from "@mcmec/domain";
import { documents } from "../../db/schema";
import { toColumnValues } from "../columns";
import { deleteRow, isForeignKeyViolation, setFields } from "../rows";
import { CommandError, type CommandHandler } from "../types";

export const createDocument: CommandHandler<
	typeof documentCommands.createDocument
> = async ({ payload, id, tx }) => {
	// The envelope id is honoured, so the optimistic row's key IS the committed row's id —
	// which is the divergence `data.ts` had by stripping it, and what makes a retried
	// create idempotent against the primary key instead of duplicating.
	await tx.insert(documents).values({
		id,
		...toColumnValues(documents, payload),
	} as typeof documents.$inferInsert);
};

export const updateDocumentDetails: CommandHandler<
	typeof documentCommands.updateDocumentDetails
> = async ({ payload, id, tx }) => {
	await setFields(tx, documents, id, toColumnValues(documents, payload));
};

export const publishDocument: CommandHandler<
	typeof documentCommands.publishDocument
> = async ({ id, tx }) => {
	await setFields(tx, documents, id, { isPublished: true });
};

export const unpublishDocument: CommandHandler<
	typeof documentCommands.unpublishDocument
> = async ({ id, tx }) => {
	await setFields(tx, documents, id, { isPublished: false });
};

export const deleteDocument: CommandHandler<
	typeof documentCommands.deleteDocument
> = async ({ id, tx }) => {
	try {
		await deleteRow(tx, documents, id);
	} catch (e) {
		// Nothing references `documents` today, so this branch is defensive rather than
		// observed — but a deleting handler owns the FK→409 mapping itself, and a table that
		// later gains a referrer should not start returning 500s to say "still in use".
		if (isForeignKeyViolation(e)) {
			throw new CommandError(409, {
				error: "conflict",
				message: "This document is still referenced and cannot be deleted.",
				reason: "still_referenced",
			});
		}
		throw e;
	}
};
