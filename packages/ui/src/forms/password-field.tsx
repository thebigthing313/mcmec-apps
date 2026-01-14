import { FormField } from "../blocks/form-field";
import { PasswordInput } from "../inputs/password-input";
import { useFieldContext } from "./form-context";

export function PasswordField({
	...props
}: Omit<
	React.ComponentPropsWithRef<typeof FormField>,
	"children" | "errors" | "htmlFor" | "data-invalid"
>) {
	const field = useFieldContext<string>();
	return (
		<FormField
			data-invalid={!field.state.meta.isValid}
			errors={field.state.meta.errors}
			htmlFor={field.name}
			{...props}
		>
			<PasswordInput
				aria-invalid={!field.state.meta.isValid}
				id={field.name}
				name={field.name}
				onBlur={field.handleBlur}
				onChange={(e) => field.handleChange(e.target.value)}
				value={field.state.value}
			/>
		</FormField>
	);
}
