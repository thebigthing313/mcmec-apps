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
			errors={field.state.meta.errors}
			htmlFor={field.name}
			{...formFieldProps}
		>
			<TextInput
				aria-invalid={!field.state.meta.isValid}
				id={field.name}
				name={field.name}
				onBlur={field.handleBlur}
				onChange={(e) => field.handleChange(e.target.value)}
				showClear={showClear}
				showPaste={showPaste}
				showSpinner={field.state.meta.isValidating}
				showValid={showValid}
				type="text"
				value={field.state.value ?? ""}
			/>
		</FormField>
	);
}
