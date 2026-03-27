import { ErrorMessages } from "@mcmec/lib/constants/errors";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@mcmec/ui/components/alert-dialog";
import { Button } from "@mcmec/ui/components/button";
import { createFileRoute } from "@tanstack/react-router";
import {
	EmployeeForm,
	type EmployeeFormValues,
} from "@/src/components/employee-form";
import { employees } from "@/src/lib/db";

export const Route = createFileRoute("/(app)/employees/$employeeId_/edit")({
	component: RouteComponent,
	loader: async ({ params }) => {
		await employees.stateWhenReady();
		const employee = employees.get(params.employeeId);
		if (!employee) {
			throw new Error(ErrorMessages.DATABASE.RECORD_NOT_AVAILABLE);
		}
		return { crumb: "Edit", employee };
	},
});

function RouteComponent() {
	const navigate = Route.useNavigate();
	const { employee } = Route.useLoaderData();
	const { employeeId } = Route.useParams();

	const handleSubmit = async (value: EmployeeFormValues) => {
		employees.update(employeeId, (draft) => {
			draft.display_name = value.display_name;
			draft.display_title = value.display_title || null;
			draft.email = value.email;
		});
		navigate({ to: "/employees/$employeeId", params: { employeeId } });
	};

	const handleDelete = async () => {
		employees.delete(employeeId);
		navigate({ to: "/employees" });
	};

	return (
		<div className="space-y-4">
			<EmployeeForm
				defaultValues={{
					display_name: employee.display_name,
					display_title: employee.display_title ?? "",
					email: employee.email,
				}}
				formLabel="Edit Employee"
				onSubmit={handleSubmit}
				submitLabel="Update"
			/>

			<div className="max-w-2xl">
				<AlertDialog>
					<AlertDialogTrigger asChild>
						<Button className="w-full" variant="destructive">
							Delete Employee
						</Button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
							<AlertDialogDescription>
								This action cannot be undone. This will permanently delete the
								employee record for "{employee.display_name}".
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction onClick={handleDelete}>
								Delete
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>
		</div>
	);
}
