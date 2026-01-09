import { FormField } from "../blocks/form-field";
import { ComboboxInput, type ComboboxOption } from "../inputs/combobox-input";
import { useFieldContext } from "./form-context";

export function ComboboxField({
	options,
	placeholder,
	searchPlaceholder,
	emptyMessage,
	...formFieldProps
}: Omit<
	React.ComponentPropsWithRef<typeof FormField>,
	"children" | "errors" | "htmlFor" | "data-invalid"
> &
	Pick<
		React.ComponentPropsWithRef<typeof ComboboxInput>,
		"options" | "placeholder" | "searchPlaceholder" | "emptyMessage"
	>) {
	const field = useFieldContext<string>();
	return (
		<FormField
			data-invalid={!field.state.meta.isValid}
			htmlFor={field.name}
			errors={field.state.meta.errors}
			{...formFieldProps}
		>
			<ComboboxInput
				options={options}
				value={field.state.value}
				onChange={(value) => field.handleChange(value)}
				placeholder={placeholder}
				searchPlaceholder={searchPlaceholder}
				emptyMessage={emptyMessage}
				disabled={field.state.meta.isValidating}
			/>
		</FormField>
	);
}
