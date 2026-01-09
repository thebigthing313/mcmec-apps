import { FormField } from "../blocks/form-field";
import { DateTimeInput } from "../inputs/datetime-input";
import { useFieldContext } from "./form-context";

export function DateTimeField({
	placeholder,
	showTimeInput,
	...formFieldProps
}: Omit<
	React.ComponentPropsWithRef<typeof FormField>,
	"children" | "errors" | "htmlFor" | "data-invalid"
> &
	Pick<
		React.ComponentPropsWithRef<typeof DateTimeInput>,
		"placeholder" | "showTimeInput"
	>) {
	const field = useFieldContext<Date>();
	return (
		<FormField
			data-invalid={!field.state.meta.isValid}
			htmlFor={field.name}
			errors={field.state.meta.errors}
			{...formFieldProps}
		>
			<DateTimeInput
				value={field.state.value}
				onChange={(date) => field.handleChange(date ?? new Date())}
				placeholder={placeholder}
				showTimeInput={showTimeInput}
				disabled={field.state.meta.isValidating}
			/>
		</FormField>
	);
}
