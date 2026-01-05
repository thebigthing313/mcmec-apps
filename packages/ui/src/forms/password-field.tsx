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
			htmlFor={field.name}
			errors={field.state.meta.errors}
			{...props}
		>
			<PasswordInput
				id={field.name}
				name={field.name}
				value={field.state.value}
				onChange={(e) => field.handleChange(e.target.value)}
				onBlur={field.handleBlur}
				aria-invalid={!field.state.meta.isValid}
			/>
		</FormField>
	);
}
