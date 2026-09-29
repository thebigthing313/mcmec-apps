// validateSearch is never code-split, so it imports the component-free half.
import { validateRecordIndexSearch } from "@mcmec/ui/blocks/record-index-search";
import { createFileRoute } from "@tanstack/react-router";
import { EmployeesPage } from "@/src/apps/hr/employees-page";

export const Route = createFileRoute("/(app)/hr/employees/")({
	component: EmployeesPage,
	// Preloads nothing: `employees` is the root's, and the root's loader preloaded it.
	loader: () => ({ crumb: "Employees" }),
	validateSearch: validateRecordIndexSearch,
});
