import { type ComponentPropsWithRef, useState } from "react";
import { FormField } from "../blocks/form-field";
import { AutoComplete } from "../inputs/autocomplete-input";
import { useFieldContext } from "./form-context";

export function AutocompleteField({
	items,
	isLoading,
	emptyMessage,
	placeholder,
	...formFieldProps
}: Omit<
	ComponentPropsWithRef<typeof FormField>,
	"children" | "errors" | "htmlFor" | "data-invalid"
> &
	Pick<
		ComponentPropsWithRef<typeof AutoComplete>,
		"items" | "isLoading" | "emptyMessage" | "placeholder"
	>) {
	const field = useFieldContext<string>();
	const [searchValue, setSearchValue] = useState<string>("");

	return (
		<FormField
			data-invalid={!field.state.meta.isValid}
			htmlFor={field.name}
			errors={field.state.meta.errors}
			{...formFieldProps}
		>
			<AutoComplete
				selectedValue={field.state.value}
				onSelectedValueChange={(value) => field.handleChange(value)}
				searchValue={searchValue}
				onSearchValueChange={setSearchValue}
				items={items}
				isLoading={isLoading}
				emptyMessage={emptyMessage}
				placeholder={placeholder}
			/>
		</FormField>
	);
}
