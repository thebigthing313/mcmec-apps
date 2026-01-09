import type { JSONContent } from "@tiptap/core";
import { FormField } from "../blocks/form-field";
import { TiptapEditor } from "../blocks/tiptap-editor";
import { useFieldContext } from "./form-context";

export function ContentField({
	...formFieldProps
}: Omit<
	React.ComponentPropsWithRef<typeof FormField>,
	"children" | "errors" | "htmlFor" | "data-invalid"
>) {
	const field = useFieldContext<JSONContent>();
	return (
		<FormField
			data-invalid={!field.state.meta.isValid}
			htmlFor={field.name}
			errors={field.state.meta.errors}
			{...formFieldProps}
		>
			<TiptapEditor
				content={field.state.value}
				onChange={(content) => field.handleChange(content)}
			/>
		</FormField>
	);
}
