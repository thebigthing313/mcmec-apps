import { ErrorMessages } from "@mcmec/lib/constants/errors";
import { createFileRoute } from "@tanstack/react-router";
import { EditEmployeePage } from "@/src/apps/hr/edit-employee-page";

export const Route = createFileRoute("/(app)/hr/employees/$employeeId_/edit")({
	component: EditEmployeePage,
	// See ./$employeeId: waits on the root's `employees` rather than starting it.
	loader: async ({ context: { employees }, params }) => {
		await employees.preload();
		const employee = employees.get(params.employeeId);
		if (!employee) {
			throw new Error(ErrorMessages.DATABASE.RECORD_NOT_AVAILABLE);
		}
		return { crumb: "Edit", employee };
	},
});
