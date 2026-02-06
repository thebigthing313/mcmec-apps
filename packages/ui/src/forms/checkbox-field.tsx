import { FormField } from "../blocks/form-field";
import { Label } from "../components/label";
import { CheckboxInput } from "../inputs/checkbox-input";
import { useFieldContext } from "./form-context";

export function CheckboxField({
	label,
	...formFieldProps
}: Omit<
	React.ComponentPropsWithRef<typeof FormField>,
	"children" | "errors" | "htmlFor" | "data-invalid"
>) {
	const field = useFieldContext<boolean>();
	return (
		<FormField
			data-invalid={!field.state.meta.isValid}
			errors={field.state.meta.errors}
			htmlFor={field.name}
			orientation="horizontal"
			{...formFieldProps}
		>
			<CheckboxInput
				aria-invalid={!field.state.meta.isValid}
				checked={field.state.value}
				className="border-2 border-accent hover:border-accent/70 focus:ring-2 focus:ring-accent/50"
				disabled={field.state.meta.isValidating}
				id={field.name}
				name={field.name}
				onChange={(checked) => field.handleChange(checked)}
			/>
			<Label className="text-md">{label}</Label>
		</FormField>
	);
}
