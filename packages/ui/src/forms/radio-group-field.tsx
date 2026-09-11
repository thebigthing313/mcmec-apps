import { useId } from "react";
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldError,
	FieldLabel,
	FieldLegend,
	FieldSet,
	FieldTitle,
} from "../components/field";
import { RadioGroup, RadioGroupItem } from "../components/radio-group";
import { useFieldContext } from "./form-context";

export interface RadioGroupOption<T extends string | number | boolean> {
	value: T;
	label: string;
	description?: string;
}

interface RadioGroupFieldProps<T extends string | number | boolean> {
	label: string;
	description?: string;
	options: ReadonlyArray<RadioGroupOption<T>>;
	className?: string;
}

/**
 * One choice from a short, fixed list, drawn as choice cards.
 *
 * This is a fieldset rather than a FormField: a group of radios is named by a legend, not
 * by a `<label>` with nothing to point at. Radix radios only carry string values, so each
 * option is keyed by its index in `options` and the field's own value stays whatever type
 * the schema gives it — a boolean question reads as two labelled answers rather than a
 * switch whose on/off meaning the resident had to work out.
 */
export function RadioGroupField<T extends string | number | boolean>({
	label,
	description,
	options,
	className,
}: RadioGroupFieldProps<T>) {
	const field = useFieldContext<T>();
	const legendId = useId();
	const descriptionId = useId();
	const isInvalid = !field.state.meta.isValid;
	const selectedIndex = options.findIndex(
		(option) => option.value === field.state.value,
	);
	return (
		<FieldSet className={className} data-invalid={isInvalid}>
			<FieldLegend className="text-md" id={legendId}>
				{label}
			</FieldLegend>
			{description && (
				<FieldDescription id={descriptionId}>{description}</FieldDescription>
			)}
			<RadioGroup
				aria-describedby={description ? descriptionId : undefined}
				aria-invalid={isInvalid}
				aria-labelledby={legendId}
				name={field.name}
				onBlur={field.handleBlur}
				onValueChange={(value) => {
					const option = options[Number(value)];
					if (option) field.handleChange(option.value);
				}}
				value={selectedIndex === -1 ? "" : String(selectedIndex)}
			>
				{options.map((option, index) => {
					const id = `${field.name}-${index}`;
					return (
						<FieldLabel htmlFor={id} key={id}>
							<Field orientation="horizontal">
								<FieldContent>
									<FieldTitle>{option.label}</FieldTitle>
									{option.description && (
										<FieldDescription>{option.description}</FieldDescription>
									)}
								</FieldContent>
								<RadioGroupItem id={id} value={String(index)} />
							</Field>
						</FieldLabel>
					);
				})}
			</RadioGroup>
			<FieldError errors={field.state.meta.errors} />
		</FieldSet>
	);
}
