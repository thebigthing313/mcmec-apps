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
import { Plus } from "lucide-react";
import { useState } from "react";
import z from "zod";
import { useDb } from "@/src/lib/db";

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
			employees.insert({
				id: crypto.randomUUID(),
				display_name: value.display_name,
				display_title: value.display_title || null,
				email: value.email,
				user_id: null,
				created_at: new Date(),
				updated_at: new Date(),
				created_by: null,
				updated_by: null,
			});
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
