import { EmployeesRowSchema } from "@mcmec/schemas/db/employees";
import { createEagerCollection } from "../electric-collection";

/**
 * Asked for by the `(app)` layout, which preloads it: the shell shows the signed-in User's
 * Employee name and title on every screen. HR's screens and Admin's Users grid read this same
 * instance from context rather than asking again (#239), and HR writes it through commands.
 */
export function create(apiUrl: string) {
	return createEagerCollection({
		apiUrl,
		commands: true,
		schema: EmployeesRowSchema,
		table: "employees",
	});
}
