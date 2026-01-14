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
			errors={field.state.meta.errors}
			htmlFor={field.name}
			{...formFieldProps}
		>
			<PhoneInput
				aria-invalid={!field.state.meta.isValid}
				id={field.name}
				name={field.name}
				onChange={(value) => field.handleChange(value)}
				showExt={showExt}
				value={field.state.value}
			/>
		</FormField>
	);
}
