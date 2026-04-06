import { FormField } from "../blocks/form-field";
import { TimeInput } from "../inputs/time-input";
import { useFieldContext } from "./form-context";

export function TimeField(
	formFieldProps: Omit<
		React.ComponentPropsWithRef<typeof FormField>,
		"children" | "errors" | "htmlFor" | "data-invalid"
	>,
) {
	const field = useFieldContext<string>();
	return (
		<FormField
			data-invalid={!field.state.meta.isValid}
			errors={field.state.meta.errors}
			htmlFor={field.name}
			{...formFieldProps}
		>
			<TimeInput
				aria-invalid={!field.state.meta.isValid}
				id={field.name}
				name={field.name}
				onBlur={field.handleBlur}
				onChange={(e) => field.handleChange(e.target.value)}
				value={field.state.value ?? ""}
			/>
		</FormField>
	);
}
