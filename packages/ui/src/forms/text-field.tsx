import { FormField } from "../blocks/form-field";
import { TextInput } from "../inputs/text-input";
import { useFieldContext } from "./form-context";

export function TextField({
	showValid,
	showClear,
	showPaste,
	autoComplete,
	inputMode,
	maxLength,
	// Forwarded, not fixed. The four hand-rolled logins this field replaced set `type="email"`
	// themselves, and hardcoding `text` here would have quietly taken the email keyboard off
	// every phone and the browser's own address validation off every one of them.
	type = "text",
	...formFieldProps
}: Omit<
	React.ComponentPropsWithRef<typeof FormField>,
	"children" | "errors" | "htmlFor" | "data-invalid"
> &
	Pick<
		React.ComponentPropsWithRef<typeof TextInput>,
		| "showPaste"
		| "showClear"
		| "showValid"
		| "autoComplete"
		| "type"
		| "inputMode"
		| "maxLength"
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
				aria-required={formFieldProps.required}
				autoComplete={autoComplete}
				id={field.name}
				inputMode={inputMode}
				maxLength={maxLength}
				name={field.name}
				onBlur={field.handleBlur}
				onChange={(e) => field.handleChange(e.target.value)}
				showClear={showClear}
				showPaste={showPaste}
				showSpinner={field.state.meta.isValidating}
				showValid={showValid}
				type={type}
				value={field.state.value ?? ""}
			/>
		</FormField>
	);
}
