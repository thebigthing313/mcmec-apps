import { FormField } from "../blocks/form-field";
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
			errors={field.state.meta.errors}
			htmlFor={field.name}
			orientation="horizontal"
			{...formFieldProps}
		>
			<div className="flex items-center space-x-2">
				<Switch
					aria-invalid={!field.state.meta.isValid}
					checked={field.state.value}
					id={field.name}
					name={field.name}
					onBlur={field.handleBlur}
					onCheckedChange={(checked) => field.handleChange(checked)}
				/>
			</div>
		</FormField>
	);
}
