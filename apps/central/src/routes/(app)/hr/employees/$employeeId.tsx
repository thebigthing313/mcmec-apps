import { createFileRoute, notFound } from "@tanstack/react-router";
import { EmployeePage } from "@/src/apps/hr/employee-page";

export const Route = createFileRoute("/(app)/hr/employees/$employeeId")({
	component: EmployeePage,
	// `employees` is the root's and already preloaded there; this waits for it, it does not start
	// it, so a missing id's `notFound()` leaves no stray sync behind (the shell subscribes).
	loader: async ({ context: { employees }, params }) => {
		await employees.preload();
		const employee = employees.get(params.employeeId);
		if (!employee) {
			throw notFound();
		}
		return { crumb: employee.display_name, employee };
	},
});
