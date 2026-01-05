import { FormField } from "../blocks/form-field";
import { TextInput } from "../inputs/text-input";
import { useFieldContext } from "./form-context";

export function TextField({
	showValid,
	showClear,
	showPaste,
	...formFieldProps
}: Omit<
	React.ComponentPropsWithRef<typeof FormField>,
	"children" | "errors" | "htmlFor" | "data-invalid"
> &
	Pick<
		React.ComponentPropsWithRef<typeof TextInput>,
		"showPaste" | "showClear" | "showValid"
	>) {
	const field = useFieldContext<string>();
	return (
		<FormField
			data-invalid={!field.state.meta.isValid}
			htmlFor={field.name}
			errors={field.state.meta.errors}
			{...formFieldProps}
		>
			<TextInput
				id={field.name}
				type="text"
				name={field.name}
				value={field.state.value}
				showSpinner={field.state.meta.isValidating}
				showValid={showValid}
				showClear={showClear}
				showPaste={showPaste}
				onChange={(e) => field.handleChange(e.target.value)}
				onBlur={field.handleBlur}
				aria-invalid={!field.state.meta.isValid}
			/>
		</FormField>
	);
}
