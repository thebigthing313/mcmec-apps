import z from "zod";

/**
 * Staff Events (CONTEXT.md: Staff Event) — a dated item every Employee should know about.
 *
 * Days are `YYYY-MM-DD` strings and times `HH:MM[:SS]` strings, never Dates, so the day cannot
 * slip (#298). `ends_on` null is a single day; `start_time` null is all day.
 *
 * The three rules below are the table's check constraints, restated so a form can say which field
 * is wrong before Postgres refuses the row. `@mcmec/domain` applies the same function to the
 * command payloads.
 */

/** `"17:00"` and `"17:00:00"` are the same time; compare them as the same string. */
function clock(time: string): string {
	return time.length === 5 ? `${time}:00` : time;
}

type DateFields = {
	starts_on?: string;
	ends_on?: string | null;
	start_time?: string | null;
	end_time?: string | null;
};

/**
 * Checks the cross-field rules on whatever of the four fields is present.
 *
 * A partial update may carry only half of a pair; a rule whose fields are not all here is left
 * to the database, which sees the whole row.
 */
export function checkStaffEventDates(
	value: DateFields,
	ctx: z.core.$RefinementCtx<DateFields>,
): void {
	const has = (key: keyof DateFields) => value[key] !== undefined;

	if (has("starts_on") && has("ends_on") && value.ends_on != null) {
		if (value.ends_on < (value.starts_on as string)) {
			ctx.addIssue({
				code: "custom",
				message: "The end date can't be before the start date.",
				path: ["ends_on"],
			});
		}
	}

	if (has("start_time") && has("end_time") && value.end_time != null) {
		if (value.start_time == null) {
			ctx.addIssue({
				code: "custom",
				message: "An end time needs a start time.",
				path: ["end_time"],
			});
		} else if (
			has("ends_on") &&
			value.ends_on == null &&
			clock(value.end_time) <= clock(value.start_time)
		) {
			ctx.addIssue({
				code: "custom",
				message:
					"On a one-day Staff Event the end time has to be after the start time.",
				path: ["end_time"],
			});
		}
	}
}

export const StaffEventsRowSchema = z
	.object({
		created_at: z.coerce.date<Date>(),
		description: z.string().nullable(),
		end_time: z.string().nullable(),
		ends_on: z.iso.date().nullable(),
		id: z.uuid(),
		is_cancelled: z.boolean(),
		location: z.string().nullable(),
		start_time: z.string().nullable(),
		starts_on: z.iso.date(),
		title: z.string().min(1),
		updated_at: z.coerce.date<Date>(),
		url: z.url().nullable(),
	})
	.superRefine(checkStaffEventDates);

export type StaffEventsRowType = z.infer<typeof StaffEventsRowSchema>;
