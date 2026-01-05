import { Card, CardContent } from "../components/card";
import {
	FieldDescription,
	FieldGroup,
	FieldLegend,
	FieldSet,
} from "../components/field";
import { useAppForm } from "../forms/form-context";

interface LoginFormProps {
	onSignIn: (email: string, password: string) => Promise<void>;
}
export function LoginForm({ onSignIn }: LoginFormProps) {
	const form = useAppForm({
		defaultValues: {
			email: "",
			password: "",
		},
		onSubmit: async ({ value }) => {
			await onSignIn(value.email, value.password);
		},
	});
	return (
		<div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
			<div className="w-full max-w-sm">
				<div className="flex flex-col gap-6">
					<Card>
						<CardContent>
							<form
								onSubmit={(e) => {
									e.preventDefault();
									e.stopPropagation();
									form.handleSubmit();
								}}
							>
								<FieldSet>
									<FieldLegend>Login to Your Account</FieldLegend>
									<FieldDescription>Welcome back!</FieldDescription>
									<FieldGroup>
										<form.AppField name="email">
											{(field) => <field.TextField label="Email" />}
										</form.AppField>

										<form.AppField name="password">
											{(field) => <field.PasswordField label="Password" />}
										</form.AppField>

										<form.AppForm>
											<form.SubmitFormButton label="Login" className="w-full" />
										</form.AppForm>
									</FieldGroup>
								</FieldSet>
							</form>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
