import { FormField } from "../blocks/form-field";
import { Label } from "../components/label";
import { CheckboxInput } from "../inputs/checkbox-input";
import { useFieldContext } from "./form-context";

export function CheckboxField({
	label,
	...formFieldProps
}: Omit<
	React.ComponentPropsWithRef<typeof FormField>,
	/*
	 * `required` is omitted because it would be a silent no-op here: the marker is drawn
	 * beside FormField's own label, and this field deliberately withholds `label` from
	 * FormField (see below), so nothing would render and no caller would find out.
	 */
	"children" | "errors" | "htmlFor" | "data-invalid" | "required"
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
			{/*
			 * htmlFor is the whole point of this label. Without it the Radix checkbox is a
			 * button with no accessible name at all, and the visible text beside it does not
			 * toggle the box when clicked. `label` is deliberately not handed to FormField
			 * above — a horizontal field puts its label after the control, not before it.
			 */}
			<Label className="text-md" htmlFor={field.name}>
				{label}
			</Label>
		</FormField>
	);
}
