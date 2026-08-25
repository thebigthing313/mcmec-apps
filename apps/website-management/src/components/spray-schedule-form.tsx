import {
	NonEmptyDateSchema,
	NonEmptyStringSchema,
	NonEmptyUUID,
} from "@mcmec/lib/constants/validators";
import { useAppForm } from "@mcmec/ui/forms/form-context";
import type { ComboboxOption } from "@mcmec/ui/inputs/combobox-input";
import type { MultiComboboxOption } from "@mcmec/ui/inputs/multi-combobox-input";
import z from "zod";

const TimeStringSchema = z.string().min(1, "Time is required.");

/**
 * The details of a spray mission — exactly the fields `website.updateSprayMissionDetails`
 * accepts.
 *
 * `status` is not here. It was a `ComboboxField` of all four states, which is the conflation
 * ADR 0001 exists to remove — and a dropdown that assigns a state cannot say that completing a
 * mission is terminal, or that a cancelled one can be put back. Those are four named commands
 * now, offered as buttons by whatever screen renders this form.
 *
 * `municipality_ids` stays, and stays inside the form: it is part of what the user is editing,
 * even though it is not a column of `spray_schedules`. What changes is where it goes on save —
 * one command carrying both, instead of a second HTTP request that could fail on its own.
 *
 * Nor are `id`, `created_at` and `updated_at`: they were only ever here because the old generic
 * `PATCH /api/data/spray_schedules` wanted a whole row.
 */
export interface SprayMissionFormValues {
	mission_date: Date;
	start_time: string;
	end_time: string;
	rain_date: Date | null;
	area_description: string;
	map_url: string | null;
	insecticide_id: string;
	municipality_ids: string[];
}

interface SprayScheduleFormProps {
	defaultValues: SprayMissionFormValues;
	onSubmit: (value: SprayMissionFormValues) => void | Promise<void>;
	insecticideOptions: ComboboxOption[];
	municipalityOptions: MultiComboboxOption[];
	formLabel: string;
	submitLabel: string;
	/**
	 * Lifecycle actions rendered beneath the fields — ADR 0001's buttons, never fields.
	 *
	 * A render prop rather than a plain node because Save-and-X needs the form's *current*
	 * values: the caller diffs them against the live row to decide whether the label says
	 * "Cancel Mission" or "Save and Cancel Mission", and to fill the
	 * `updateSprayMissionDetails` half of the envelope.
	 */
	actions?: (state: { values: SprayMissionFormValues }) => React.ReactNode;
}

export function SprayScheduleForm({
	defaultValues,
	onSubmit,
	insecticideOptions,
	municipalityOptions,
	formLabel,
	submitLabel,
	actions,
}: SprayScheduleFormProps) {
	const form = useAppForm({
		defaultValues,
		onSubmit: async ({ value }) => {
			await onSubmit(value);
		},
	});

	return (
		<form.AppForm>
			<form.FormWrapper className="max-w-2xl" formLabel={formLabel}>
				<form.AppField
					name="mission_date"
					validators={{ onBlur: NonEmptyDateSchema }}
				>
					{(field) => (
						<field.DateTimeField
							label="Mission Date"
							placeholder="Select date"
							showTimeInput={false}
						/>
					)}
				</form.AppField>
				<form.AppField
					name="start_time"
					validators={{ onBlur: TimeStringSchema }}
				>
					{(field) => <field.TimeField label="Start Time" />}
				</form.AppField>
				<form.AppField
					name="end_time"
					validators={{ onBlur: TimeStringSchema }}
				>
					{(field) => <field.TimeField label="End Time" />}
				</form.AppField>
				<form.AppField name="rain_date">
					{(field) => (
						<field.DateTimeField
							description="Optional backup date in case of rain. Setting one while delaying a mission is a single Save and Delay."
							label="Rain Date"
							placeholder="Select rain date"
							showTimeInput={false}
						/>
					)}
				</form.AppField>
				<form.AppField
					name="area_description"
					validators={{ onBlur: NonEmptyStringSchema(5) }}
				>
					{(field) => (
						<field.TextAreaField
							description="Describe the area(s) to be sprayed."
							label="Area Description"
						/>
					)}
				</form.AppField>
				<form.AppField name="map_url">
					{(field) => (
						<field.TextField
							description="Link to an external map showing the spray area."
							label="Map URL"
							showPaste={true}
						/>
					)}
				</form.AppField>
				<form.AppField
					name="insecticide_id"
					validators={{ onChange: NonEmptyUUID }}
				>
					{(field) => (
						<field.ComboboxField
							label="Insecticide"
							options={insecticideOptions}
							placeholder="Select insecticide..."
						/>
					)}
				</form.AppField>
				<form.AppField name="municipality_ids">
					{(field) => (
						<field.MultiComboboxField
							description="Select the municipalities covered by this spray mission."
							emptyMessage="No municipalities found."
							label="Municipalities"
							options={municipalityOptions}
							placeholder="Select municipalities..."
							searchPlaceholder="Search municipalities..."
						/>
					)}
				</form.AppField>
				<form.SubmitFormButton className="w-full" label={submitLabel} />
				{actions ? (
					<form.Subscribe selector={(state) => state.values}>
						{(values) => actions({ values })}
					</form.Subscribe>
				) : null}
			</form.FormWrapper>
		</form.AppForm>
	);
}
