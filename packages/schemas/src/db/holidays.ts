import z from "zod";

/**
 * Holidays (CONTEXT.md: Holiday) — a day the Commission observes with its offices closed.
 *
 * The two dates are `YYYY-MM-DD` strings, not Dates. A `date` column names a day, not an instant,
 * and a Date built from one is UTC midnight, which every zone west of Greenwich reads as the day
 * before. Kept as text end to end, the day cannot slip (#298). Central's `holidays` collection
 * syncs them as text too, so a synced row and an optimistic one agree.
 *
 * `observed_on` is unique in Postgres; a second Holiday on one day is refused by the command as
 * `holiday_date_taken`. `falls_on` is the nominal date when it differs, and null when the Holiday
 * falls on the day it is observed.
 */
export const HolidaysRowSchema = z.object({
	created_at: z.coerce.date<Date>(),
	falls_on: z.iso.date().nullable(),
	id: z.uuid(),
	name: z.string().min(1),
	observed_on: z.iso.date(),
	updated_at: z.coerce.date<Date>(),
});

export type HolidaysRowType = z.infer<typeof HolidaysRowSchema>;
