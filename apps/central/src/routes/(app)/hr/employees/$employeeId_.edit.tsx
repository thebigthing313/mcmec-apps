import { createFileRoute, notFound } from "@tanstack/react-router";
import { EditEmployeePage } from "@/src/apps/hr/edit-employee-page";

export const Route = createFileRoute("/(app)/hr/employees/$employeeId_/edit")({
	component: EditEmployeePage,
	// See ./$employeeId: waits on the root's `employees` rather than starting it, and a missing id
	// is not-found here too, as on every other record route in central.
	loader: async ({ context: { employees }, params }) => {
		await employees.preload();
		const employee = employees.get(params.employeeId);
		if (!employee) {
			throw notFound();
		}
		return { crumb: "Edit", employee };
	},
});
