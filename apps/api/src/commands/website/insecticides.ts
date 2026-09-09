/**
 * Handlers for the three `insecticides` commands.
 *
 * A catalogue table: six columns, no lifecycle, and a delete refused while a Spray Mission
 * still names the product.
 */
import type { insecticides as insecticideCommands } from "@mcmec/domain";
import { insecticides } from "../../db/schema";
import { toColumnValues } from "../columns";
import { deleteRow, isForeignKeyViolation, setFields } from "../rows";
import { CommandError, type CommandHandler } from "../types";

export const createInsecticide: CommandHandler<
	typeof insecticideCommands.createInsecticide
> = async ({ payload, id, tx }) => {
	await tx.insert(insecticides).values({
		id,
		...toColumnValues(insecticides, payload),
	} as typeof insecticides.$inferInsert);
};

export const updateInsecticideDetails: CommandHandler<
	typeof insecticideCommands.updateInsecticideDetails
> = async ({ payload, id, tx }) => {
	await setFields(tx, insecticides, id, toColumnValues(insecticides, payload));
};

export const deleteInsecticide: CommandHandler<
	typeof insecticideCommands.deleteInsecticide
> = async ({ id, tx }) => {
	try {
		await deleteRow(tx, insecticides, id);
	} catch (e) {
		// `spray_schedules.insecticide_id` is `on delete restrict`. Unlike the two category
		// screens, the insecticides UI offers no count and no disabled state — the delete
		// dialog asks and this is the only place the answer is known.
		if (isForeignKeyViolation(e)) {
			throw new CommandError(409, {
				error: "conflict",
				message:
					"This insecticide is used by one or more spray missions and cannot be " +
					"deleted.",
				reason: "still_referenced",
			});
		}
		throw e;
	}
};
