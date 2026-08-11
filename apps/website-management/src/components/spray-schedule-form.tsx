import {
	NonEmptyDateSchema,
	NonEmptyStringSchema,
	NonEmptyUUID,
} from "@mcmec/lib/constants/validators";
import type { SpraySchedulesRowType } from "@mcmec/supabase/db/spray-schedules";
import { useAppForm } from "@mcmec/ui/forms/form-context";
import type { ComboboxOption } from "@mcmec/ui/inputs/combobox-input";
import type { MultiComboboxOption } from "@mcmec/ui/inputs/multi-combobox-input";
import z from "zod";

const STATUS_OPTIONS: ComboboxOption[] = [
	{ label: "Scheduled", value: "scheduled" },
	{ label: "Delayed", value: "delayed" },
	{ label: "Cancelled", value: "cancelled" },
	{ label: "Completed", value: "completed" },
];

const TimeStringSchema = z.string().min(1, "Time is required.");

interface SprayScheduleFormValues extends SpraySchedulesRowType {
	municipality_ids: string[];
}

interface SprayScheduleFormProps {
	defaultValues: SprayScheduleFormValues;
	onSubmit: (
		value: SpraySchedulesRowType,
		municipalityIds: string[],
	) => void | Promise<void>;
	insecticideOptions: ComboboxOption[];
	municipalityOptions: MultiComboboxOption[];
	formLabel: string;
	submitLabel: string;
}

export function SprayScheduleForm({
	defaultValues,
	onSubmit,
	insecticideOptions,
	municipalityOptions,
	formLabel,
	submitLabel,
}: SprayScheduleFormProps) {
	const form = useAppForm({
		defaultValues,
		onSubmit: async ({ value }) => {
			const { municipality_ids, ...scheduleValues } = value;
			await onSubmit(scheduleValues as SpraySchedulesRowType, municipality_ids);
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
							description="Optional backup date in case of rain."
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
				<form.AppField name="status">
					{(field) => (
						<field.ComboboxField
							label="Status"
							options={STATUS_OPTIONS}
							placeholder="Select status..."
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
			</form.FormWrapper>
		</form.AppForm>
	);
}
