import { FormField } from "../blocks/form-field";
import { Switch } from "../components/switch";
import { useFieldContext } from "./form-context";

interface SwitchFieldProps {
	labelWhenTrue?: string;
	labelWhenFalse?: string;
}

export function SwitchField({
	labelWhenTrue,
	labelWhenFalse,
	...formFieldProps
}: SwitchFieldProps &
	Omit<
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
			<div className="flex w-full flex-row items-start justify-between gap-4 rounded-md bg-accent/10 p-4">
				{labelWhenTrue || labelWhenFalse ? (
					<div className="text-wrap font-semibold">
						{field.state.value
							? labelWhenTrue && <span>{labelWhenTrue}</span>
							: labelWhenFalse && <span>{labelWhenFalse}</span>}
					</div>
				) : null}
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
