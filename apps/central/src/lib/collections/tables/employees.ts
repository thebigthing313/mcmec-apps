import { EmployeesRowSchema } from "@mcmec/schemas/db/employees";
import { createEagerCollection } from "../electric-collection";

/**
 * Asked for by the `(app)` layout, which preloads it: the shell shows the signed-in User's
 * Employee name and title on every screen.
 *
 * Read-only here, and `commands: true` all the same: the flag says how the TABLE is written, not
 * whether this app writes it (#174).
 */
export function create(apiUrl: string) {
	return createEagerCollection({
		apiUrl,
		commands: true,
		schema: EmployeesRowSchema,
		table: "employees",
	});
}
