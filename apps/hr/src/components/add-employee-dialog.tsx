import { ValidEmailSchema } from "@mcmec/lib/constants/validators";
import { Button } from "@mcmec/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@mcmec/ui/components/dialog";
import { FieldGroup, FieldSet } from "@mcmec/ui/components/field";
import { useAppForm } from "@mcmec/ui/forms/form-context";
import { toastOnError } from "@mcmec/ui/lib/toast-on-error";
import { Plus } from "lucide-react";
import { useState } from "react";
import z from "zod";
import { intents, useDb } from "@/src/lib/db";

export function AddEmployeeDialog() {
	const [open, setOpen] = useState(false);
	const { employees } = useDb();

	const form = useAppForm({
		defaultValues: {
			display_name: "",
			display_title: "",
			email: "",
		},
		onSubmit: async ({ value }) => {
			const now = new Date();
			const tx = employees.insert(
				{
					created_at: now,
					display_name: value.display_name,
					display_title: value.display_title || null,
					email: value.email,
					id: crypto.randomUUID(),
					updated_at: now,
					// Mirrors what `addEmployee` writes. `user_id` is in no payload, so there is
					// no body that could create an employee already linked to an account — the
					// link is `employees.inviteEmployee`'s to make.
					user_id: null,
				},
				intents("employees.addEmployee"),
			);
			toastOnError(tx, "Failed to add employee.");
			setOpen(false);
			form.reset();
		},
	});

	return (
		<Dialog onOpenChange={setOpen} open={open}>
			<DialogTrigger asChild>
				<Button>
					<Plus className="mr-1 h-4 w-4" />
					Add Employee
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add Employee</DialogTitle>
					<DialogDescription>
						Add a new employee record. You can send them an account invite
						afterward.
					</DialogDescription>
				</DialogHeader>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
				>
					<FieldSet>
						<FieldGroup>
							<form.AppField
								name="display_name"
								validators={{
									onBlur: z.string().min(1, "Name is required."),
								}}
							>
								{(field) => <field.TextField label="Full Name" />}
							</form.AppField>

							<form.AppField
								name="email"
								validators={{ onBlur: ValidEmailSchema }}
							>
								{(field) => <field.TextField label="Email" />}
							</form.AppField>

							<form.AppField name="display_title">
								{(field) => <field.TextField label="Title (optional)" />}
							</form.AppField>
						</FieldGroup>
					</FieldSet>
					<DialogFooter className="mt-4">
						<Button
							onClick={() => setOpen(false)}
							type="button"
							variant="outline"
						>
							Cancel
						</Button>
						<form.AppForm>
							<form.SubmitFormButton label="Add Employee" />
						</form.AppForm>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
