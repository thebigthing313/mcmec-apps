/**
 * Handlers for the three `holidays` commands.
 *
 * The plain shape — an insert honouring the envelope id, a row-scoped `set`, a delete — plus one
 * mapping: `observed_on` is unique, and a second Holiday on a day already closed is refused as
 * `holiday_date_taken` with a sentence naming the day. The HR form keys its Observed field error
 * off that `reason`, which is why it must not fall through to the dispatcher's generic 409.
 */
import type { holidays as holidayCommands } from "@mcmec/domain";
import { formatDateShortWithWeekday } from "@mcmec/lib/functions/date-fns";
import { holidays } from "../../db/schema";
import { toColumnValues } from "../columns";
import { deleteRow, isUniqueViolation, setFields } from "../rows";
import { CommandError, type CommandHandler } from "../types";

/** Drizzle's name for `observed_on`'s unique constraint (see drizzle/0007_holidays.sql). */
const OBSERVED_ON_UNIQUE = "holidays_observed_on_unique";

function dateTaken(observedOn: string | undefined): CommandError {
	const day = observedOn ? formatDateShortWithWeekday(observedOn) : "that day";
	return new CommandError(409, {
		error: "conflict",
		message: `There is already a Holiday on ${day}.`,
		reason: "holiday_date_taken",
	});
}

export const createHoliday: CommandHandler<
	typeof holidayCommands.createHoliday
> = async ({ payload, id, tx }) => {
	try {
		await tx.insert(holidays).values({
			id,
			...toColumnValues(holidays, payload),
		} as typeof holidays.$inferInsert);
	} catch (e) {
		if (isUniqueViolation(e, OBSERVED_ON_UNIQUE))
			throw dateTaken(payload.observed_on);
		throw e;
	}
};

export const updateHoliday: CommandHandler<
	typeof holidayCommands.updateHoliday
> = async ({ payload, id, tx }) => {
	try {
		await setFields(tx, holidays, id, toColumnValues(holidays, payload));
	} catch (e) {
		if (isUniqueViolation(e, OBSERVED_ON_UNIQUE))
			throw dateTaken(payload.observed_on);
		throw e;
	}
};

/** Nothing references a Holiday, so a delete has no FK to map. */
export const deleteHoliday: CommandHandler<
	typeof holidayCommands.deleteHoliday
> = async ({ id, tx }) => {
	await deleteRow(tx, holidays, id);
};
