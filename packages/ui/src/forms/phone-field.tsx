import { FormField } from "../blocks/form-field";
import { PhoneInput } from "../inputs/phone-input";
import { useFieldContext } from "./form-context";

export function PhoneField({
	showExt = true,
	...formFieldProps
}: Omit<
	React.ComponentPropsWithRef<typeof FormField>,
	"children" | "errors" | "htmlFor" | "data-invalid"
> &
	Pick<React.ComponentPropsWithRef<typeof PhoneInput>, "showExt">) {
	const field = useFieldContext<string | undefined>();
	return (
		<FormField
			data-invalid={!field.state.meta.isValid}
			htmlFor={field.name}
			errors={field.state.meta.errors}
			{...formFieldProps}
		>
			<PhoneInput
				id={field.name}
				name={field.name}
				value={field.state.value}
				onChange={(value) => field.handleChange(value)}
				showExt={showExt}
				aria-invalid={!field.state.meta.isValid}
			/>
		</FormField>
	);
}
