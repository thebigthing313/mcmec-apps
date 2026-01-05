import { FieldGroup, FieldSet } from "../components/field";
import { withFieldGroup } from "./form-context";

export type NameFields = {
	firstName: string;
	lastName: string;
};

const defaultValues: NameFields = {
	firstName: "",
	lastName: "",
};

export const NameFieldGroupFields = withFieldGroup({
	defaultValues,
	props: {},
	render: function Render({ group }) {
		return (
			<FieldSet>
				<FieldGroup className="@container/field-group flex flex-row gap-2">
					<group.AppField name="firstName">
						{(field) => <field.TextField label="First Name" />}
					</group.AppField>
					<group.AppField name="lastName">
						{(field) => <field.TextField label="Last Name" />}
					</group.AppField>
				</FieldGroup>
			</FieldSet>
		);
	},
});
