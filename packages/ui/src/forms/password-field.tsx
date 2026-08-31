import { FormField } from "../blocks/form-field";
import { PasswordInput } from "../inputs/password-input";
import { useFieldContext } from "./form-context";

export function PasswordField({
	autoComplete,
	...props
}: Omit<
	React.ComponentPropsWithRef<typeof FormField>,
	"children" | "errors" | "htmlFor" | "data-invalid"
> &
	Pick<React.ComponentPropsWithRef<typeof PasswordInput>, "autoComplete">) {
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
				// Without this a password manager cannot tell "the password you have" from "the
				// password you are choosing", and offers to overwrite the wrong one. Three of the
				// four staff logins set it by hand; the shared field now carries it for all of them.
				autoComplete={autoComplete}
				id={field.name}
				name={field.name}
				onBlur={field.handleBlur}
				onChange={(e) => field.handleChange(e.target.value)}
				value={field.state.value}
			/>
		</FormField>
	);
}
