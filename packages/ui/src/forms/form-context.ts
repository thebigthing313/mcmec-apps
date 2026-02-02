import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { AutocompleteField } from "./autocomplete-field";
import { ComboboxField } from "./combobox-field";
import { ContentField } from "./content-field";
import { DateTimeField } from "./datetime-field";
import { FormWrapper } from "./form-wrapper";
import { PasswordField } from "./password-field";
import { PhoneField } from "./phone-field";
import { ResetFormButton } from "./reset-form-button";
import { SubmitFormButton } from "./submit-form-button";
import { SwitchField } from "./switch-field";
import { TextField } from "./text-field";
import { TextAreaField } from "./textarea-field";

export const { fieldContext, formContext, useFieldContext, useFormContext } =
	createFormHookContexts();

export const { useAppForm, withFieldGroup } = createFormHook({
	fieldComponents: {
		AutocompleteField,
		ComboboxField,
		ContentField,
		DateTimeField,
		PasswordField,
		PhoneField,
		SwitchField,
		TextAreaField,
		TextField,
	},
	fieldContext,
	formComponents: { FormWrapper, ResetFormButton, SubmitFormButton },
	formContext,
});
