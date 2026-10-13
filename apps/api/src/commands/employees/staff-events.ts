/**
 * Handlers for the five `staff_events` commands.
 *
 * The meetings shape without its precondition: cancel and uncancel are named row-scoped `set`s
 * that any state and any date may take — a Staff Event needs no reason to be called off, and a
 * past one can still be put right. The date rules are the table's check constraints, which the
 * dispatcher's `pgErrorResponse` turns into a 422 when a partial update gets past the payload.
 */
import type { staffEvents as staffEventCommands } from "@mcmec/domain";
import { staffEvents } from "../../db/schema";
import { toColumnValues } from "../columns";
import { deleteRow, setFields } from "../rows";
import type { CommandHandler } from "../types";

export const createStaffEvent: CommandHandler<
	typeof staffEventCommands.createStaffEvent
> = async ({ payload, id, tx }) => {
	// The envelope id is honoured, so the optimistic row's key is the committed row's id.
	await tx.insert(staffEvents).values({
		id,
		isCancelled: false,
		...toColumnValues(staffEvents, payload),
	} as typeof staffEvents.$inferInsert);
};

export const updateStaffEventDetails: CommandHandler<
	typeof staffEventCommands.updateStaffEventDetails
> = async ({ payload, id, tx }) => {
	await setFields(tx, staffEvents, id, toColumnValues(staffEvents, payload));
};

export const cancelStaffEvent: CommandHandler<
	typeof staffEventCommands.cancelStaffEvent
> = async ({ id, tx }) => {
	await setFields(tx, staffEvents, id, { isCancelled: true });
};

export const uncancelStaffEvent: CommandHandler<
	typeof staffEventCommands.uncancelStaffEvent
> = async ({ id, tx }) => {
	await setFields(tx, staffEvents, id, { isCancelled: false });
};

/** Nothing references a Staff Event, so a delete has no FK to map. */
export const deleteStaffEvent: CommandHandler<
	typeof staffEventCommands.deleteStaffEvent
> = async ({ id, tx }) => {
	await deleteRow(tx, staffEvents, id);
};
