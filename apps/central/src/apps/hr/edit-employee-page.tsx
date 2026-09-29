import { PageHeader } from "@mcmec/ui/blocks/page-header";
import { rowVersion, useFormSeed } from "@mcmec/ui/hooks/use-form-seed";
import { toastOnError } from "@mcmec/ui/lib/toast-on-error";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { getRouteApi } from "@tanstack/react-router";
import { intents } from "@/src/lib/intents";
import { EmployeeForm, type EmployeeFormValues } from "./employee-form";

const route = getRouteApi("/(app)/hr/employees/$employeeId_/edit");

/** `/hr/employees/$employeeId/edit`: an Employee's details. Delete lives on the detail page. */
export function EditEmployeePage() {
	const navigate = route.useNavigate();
	const { employee: loadedEmployee } = route.useLoaderData();
	const { employeeId } = route.useParams();
	const { employees } = route.useRouteContext();

	const { data: liveEmployees } = useLiveQuery(
		(q) =>
			q
				.from({ employee: employees })
				.where(({ employee }) => eq(employee.id, employeeId)),
		[employees, employeeId],
	);
	const employee = liveEmployees[0] ?? loadedEmployee;

	// Seed from the live row, and re-seed when it changes until the user takes the form — see
	// @mcmec/ui/hooks/use-form-seed. `updateEmployeeDetails` sends the diff against the LIVE
	// row, so a stale seed writes itself back and silently reverts whatever changed meanwhile.
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
		navigate({ params: { employeeId }, to: "/hr/employees/$employeeId" });
	};

	// No delete here: ADR 0001 puts `delete*` on the detail page, in a danger zone, behind a
	// confirm — and nowhere else.
	return (
		<div className="space-y-4" {...latchProps}>
			<PageHeader title="Edit Employee" />
			<EmployeeForm
				defaultValues={{
					display_name: employee.display_name,
					display_title: employee.display_title ?? "",
					email: employee.email,
				}}
				key={seedKey}
				onSubmit={handleSubmit}
				submitLabel="Update"
			/>
		</div>
	);
}
