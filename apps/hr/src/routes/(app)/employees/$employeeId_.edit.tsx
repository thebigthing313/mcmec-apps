import { ErrorMessages } from "@mcmec/lib/constants/errors";
import { rowVersion, useFormSeed } from "@mcmec/ui/hooks/use-form-seed";
import { toastOnError } from "@mcmec/ui/lib/toast-on-error";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import {
	EmployeeForm,
	type EmployeeFormValues,
} from "@/src/components/employee-form";
import { employees, intents } from "@/src/lib/db";

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
	const { employee: loadedEmployee } = Route.useLoaderData();
	const { employeeId } = Route.useParams();

	const { data: liveEmployees } = useLiveQuery(
		(q) =>
			q
				.from({ employee: employees })
				.where(({ employee }) => eq(employee.id, employeeId)),
		[employeeId],
	);
	const employee = liveEmployees[0] ?? loadedEmployee;

	// Seed from the live row, and re-seed when it changes until the user takes the form — see
	// @mcmec/ui/hooks/use-form-seed. `updateEmployeeDetails` sends the diff against the LIVE
	// row, so a stale seed writes itself back and silently reverts whatever changed meanwhile.
	// Two apps edit this table, which makes a concurrent edit likelier here than anywhere.
	const { seedKey, latchProps } = useFormSeed(rowVersion(employee));

	const handleSubmit = async (value: EmployeeFormValues) => {
		const tx = employees.update(
			employeeId,
			intents("employees.updateEmployeeDetails"),
			(draft) => {
				draft.display_name = value.display_name;
				draft.display_title = value.display_title || null;
				draft.email = value.email;
			},
		);
		toastOnError(tx, "Failed to update employee.");
		navigate({ params: { employeeId }, to: "/employees/$employeeId" });
	};

	// No delete here any more: ADR 0001 puts `delete*` on the detail page, in a danger zone,
	// behind a confirm — and nowhere else.
	return (
		<div className="space-y-4" {...latchProps}>
			<EmployeeForm
				defaultValues={{
					display_name: employee.display_name,
					display_title: employee.display_title ?? "",
					email: employee.email,
				}}
				formLabel="Edit Employee"
				key={seedKey}
				onSubmit={handleSubmit}
				submitLabel="Update"
			/>
		</div>
	);
}
