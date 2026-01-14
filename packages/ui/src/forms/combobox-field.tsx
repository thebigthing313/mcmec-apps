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
			errors={field.state.meta.errors}
			htmlFor={field.name}
			{...formFieldProps}
		>
			<ComboboxInput
				disabled={field.state.meta.isValidating}
				emptyMessage={emptyMessage}
				onChange={(value) => field.handleChange(value)}
				options={options}
				placeholder={placeholder}
				searchPlaceholder={searchPlaceholder}
				value={field.state.value}
			/>
		</FormField>
	);
}
