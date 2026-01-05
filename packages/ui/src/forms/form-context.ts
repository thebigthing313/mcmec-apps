import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { AutocompleteField } from "./autocomplete-field";
import { FormWrapper } from "./form-wrapper";
import { PasswordField } from "./password-field";
import { PhoneField } from "./phone-field";
import { ResetFormButton } from "./reset-form-button";
import { SubmitFormButton } from "./submit-form-button";
import { TextField } from "./text-field";

export const { fieldContext, formContext, useFieldContext, useFormContext } =
	createFormHookContexts();

export const { useAppForm, withFieldGroup } = createFormHook({
	fieldContext,
	formContext,
	fieldComponents: {
		TextField,
		PasswordField,
		PhoneField,
		AutocompleteField,
	},
	formComponents: { FormWrapper, SubmitFormButton, ResetFormButton },
});
