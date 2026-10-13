import { useAppForm } from "@mcmec/ui/forms/form-context";
import z from "zod";

/**
 * A Holiday's fields — exactly what `employees.createHoliday` and `employees.updateHoliday` take.
 *
 * Both dates are `YYYY-MM-DD` text, as the row stores them. `falls_on` is null when the Holiday
 * falls on the day it is observed, which is most of them.
 */
export interface HolidayFormValues {
	name: string;
	observed_on: string;
	falls_on: string | null;
}

/** What a submit can report back onto a field: the server's `holiday_date_taken` sentence. */
export type HolidayFieldErrors = { observed_on?: string };

const NameSchema = z.string().trim().min(1, "Name the Holiday.");
const ObservedSchema = z.iso.date("Pick the day the offices close.");

export function HolidayForm({
	defaultValues,
	onSubmit,
	submitLabel,
}: {
	defaultValues: HolidayFormValues;
	/** Resolves with field errors when the write was refused for one, and nothing otherwise. */
	onSubmit: (
		value: HolidayFormValues,
	) => Promise<HolidayFieldErrors | undefined>;
	submitLabel: string;
}) {
	const form = useAppForm({
		defaultValues,
		onSubmit: async ({ value }) => {
			const errors = await onSubmit({
				...value,
				// "Falls on" the same day it is observed says nothing the null does not.
				falls_on: value.falls_on === value.observed_on ? null : value.falls_on,
				name: value.name.trim(),
			});
			if (errors?.observed_on) {
				const message = errors.observed_on;
				form.setFieldMeta("observed_on", (meta) => ({
					...meta,
					errorMap: { ...meta.errorMap, onServer: message },
				}));
			}
		},
	});

	return (
		<form.AppForm>
			<form.FormWrapper className="max-w-2xl">
				<form.AppField name="name" validators={{ onBlur: NameSchema }}>
					{(field) => (
						<field.TextField
							description="Coinciding Holidays share one day and one combined name — “Christmas Day and Hanukkah”."
							label="Name"
							required={true}
						/>
					)}
				</form.AppField>
				<form.AppField
					listeners={{
						// A refusal names the date that was taken; picking another clears it.
						onChange: ({ fieldApi }) =>
							fieldApi.setMeta((meta) => ({
								...meta,
								errorMap: { ...meta.errorMap, onServer: undefined },
							})),
					}}
					name="observed_on"
					validators={{ onBlur: ObservedSchema, onSubmit: ObservedSchema }}
				>
					{(field) => (
						<field.DateField
							description="The day the offices are closed."
							label="Observed"
							placeholder="Select date"
							required={true}
						/>
					)}
				</form.AppField>
				<form.AppField name="falls_on">
					{(field) => (
						<field.DateField
							clearable={true}
							description="Only when it differs from the observed day — July 4 on a Saturday is observed Friday the 3rd."
							label="Falls on"
							placeholder="Same as observed"
						/>
					)}
				</form.AppField>
				<form.SubmitFormButton className="w-full" label={submitLabel} />
			</form.FormWrapper>
		</form.AppForm>
	);
}
