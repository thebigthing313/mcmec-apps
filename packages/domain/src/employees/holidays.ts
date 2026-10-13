/**
 * `holidays` — three commands: create, update, delete.
 *
 * A Holiday has no lifecycle (CONTEXT.md: Holiday). One adopted in error, or revoked, is deleted;
 * nothing is ever "cancelled" about a day the Commission closes. So the update is plain
 * `updateHoliday` rather than `update…Details`: the suffix exists to set the detail fields apart
 * from lifecycle commands, and here there are none.
 *
 * A duplicate `observed_on` is not a payload rule — it depends on what is stored — so the handler
 * owns it and refuses with `holiday_date_taken`, which the HR form maps to the Observed field.
 *
 * `id` appears in no payload — it rides in the envelope and names the row the command is about.
 */
import { HolidaysRowSchema } from "@mcmec/schemas/db/holidays";
import z from "zod";
import { defineDomain } from "../command";

const employees = defineDomain("employees", "manage_employees");
const command = employees.table("holidays");

const DetailFields = {
	falls_on: HolidaysRowSchema.shape.falls_on,
	name: HolidaysRowSchema.shape.name,
	observed_on: HolidaysRowSchema.shape.observed_on,
} as const;

/** The delete command takes no fields — the envelope id is the whole request. */
const EmptyPayload = z.object({});

export const createHoliday = command("createHoliday", z.object(DetailFields), {
	creates: true,
});

/**
 * Partial, because the collection handler sends `mutation.changes`. The non-empty refinement is
 * what makes "an update that asks for nothing" a refusal.
 */
export const updateHoliday = command(
	"updateHoliday",
	z
		.object(DetailFields)
		.partial()
		.refine((v) => Object.keys(v).length > 0, {
			error: "no fields to update",
		}),
);

export const deleteHoliday = command("deleteHoliday", EmptyPayload);

export const HOLIDAY_COMMANDS = [
	createHoliday,
	updateHoliday,
	deleteHoliday,
] as const;
