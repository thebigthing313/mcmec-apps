import {
	toDateOnlyString,
	toLocalDateOnly,
} from "@mcmec/lib/functions/date-fns";
import { XIcon } from "lucide-react";
import { FormField } from "../blocks/form-field";
import { Button } from "../components/button";
import { DateTimeInput } from "../inputs/datetime-input";
import { useFieldContext } from "./form-context";

/**
 * A day, held as the `YYYY-MM-DD` text a `date` column stores — never as a Date.
 *
 * `DateTimeField` holds a Date, which suits a timestamp and is a trap for a day: a Date is an
 * instant, and turning it back into a day depends on the zone that reads it. This keeps the
 * value as text end to end and does the one conversion the picker needs — to local midnight
 * for `<Calendar>` and back — in the two helpers built for exactly that.
 *
 * `clearable` offers a way back to null for an optional day ("Falls on", an end date). The
 * picker alone cannot: deselecting a day in `DateTimeInput` is not something a user can find.
 */
export function DateField({
	placeholder,
	clearable = false,
	...formFieldProps
}: Omit<
	React.ComponentPropsWithRef<typeof FormField>,
	"children" | "errors" | "htmlFor" | "data-invalid"
> & {
	placeholder?: string;
	clearable?: boolean;
}) {
	const field = useFieldContext<string | null>();
	const value = field.state.value;
	return (
		<FormField
			data-invalid={!field.state.meta.isValid}
			errors={field.state.meta.errors}
			htmlFor={field.name}
			{...formFieldProps}
		>
			<div className="flex gap-2">
				<DateTimeInput
					className="flex-1"
					disabled={field.state.meta.isValidating}
					id={field.name}
					onChange={(date) => {
						field.handleChange(toDateOnlyString(date));
						field.handleBlur();
					}}
					placeholder={placeholder}
					value={toLocalDateOnly(value)}
				/>
				{clearable ? (
					// Always rendered, disabled when there is nothing to clear: a button that
					// unmounted itself on click would drop keyboard focus onto <body>.
					<Button
						aria-label={`Clear ${formFieldProps.label ?? "date"}`}
						disabled={!value}
						onClick={() => {
							field.handleChange(null);
							field.handleBlur();
						}}
						size="icon"
						type="button"
						variant="outline"
					>
						<XIcon />
					</Button>
				) : null}
			</div>
		</FormField>
	);
}
