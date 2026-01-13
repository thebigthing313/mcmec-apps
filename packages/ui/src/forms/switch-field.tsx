import { FormField } from "../blocks/form-field";
import { Label } from "../components/label";
import { Switch } from "../components/switch";
import { useFieldContext } from "./form-context";

export function SwitchField({
	...formFieldProps
}: Omit<
	React.ComponentPropsWithRef<typeof FormField>,
	"children" | "errors" | "htmlFor" | "data-invalid"
>) {
	const field = useFieldContext<boolean>();
	return (
		<FormField
			data-invalid={!field.state.meta.isValid}
			htmlFor={field.name}
			errors={field.state.meta.errors}
			{...formFieldProps}
		>
			<div className="flex items-center space-x-2">
				<Switch
					id={field.name}
					name={field.name}
					checked={field.state.value}
					onCheckedChange={(checked) => field.handleChange(checked)}
					onBlur={field.handleBlur}
					aria-invalid={!field.state.meta.isValid}
				/>
				<Label htmlFor={field.name} className="cursor-pointer">
					{formFieldProps.label}
				</Label>
			</div>
		</FormField>
	);
}
