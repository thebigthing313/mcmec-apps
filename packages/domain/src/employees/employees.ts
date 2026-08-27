/**
 * `employees` — the four commands of #134's vocabulary.
 *
 * The first domain outside `website`, and the reason domains are named for the bounded context
 * rather than for an app: `hr` and `admin` ship byte-identical copies of the add/edit/delete
 * trio today, and one command now serves both. A domain called `HR` would have re-asserted
 * exactly the coupling this removes.
 *
 * `user_id` is in no payload. It is server-owned and written by exactly one command —
 * `inviteEmployee` — which is what makes "has a login" something that happens to an employee
 * rather than a field someone can type into. That is the same omission-enforcement ADR 0001
 * describes for lifecycle columns, applied to a foreign key.
 */
import z from "zod";
import { defineDomain } from "../command";

const employees = defineDomain("employees", "manage_employees");
const command = employees.table("employees");

const DetailFields = {
	display_name: z.string().min(1),
	/** Optional on the form, and the column is nullable — an empty title is no title. */
	display_title: z.string().nullable(),
	email: z.email(),
} as const;

export const addEmployee = command("addEmployee", z.object(DetailFields), {
	creates: true,
});

/**
 * Partial, because the collection handler sends `mutation.changes`. The non-empty refinement is
 * what makes "an update that asks for nothing" a refusal.
 */
export const updateEmployeeDetails = command(
	"updateEmployeeDetails",
	z
		.object(DetailFields)
		.partial()
		.refine((v) => Object.keys(v).length > 0, {
			error: "no fields to update",
		}),
);

export const deleteEmployee = command("deleteEmployee", z.object({}));

/**
 * Staffs an employee with a login and mails them a set-password link.
 *
 * **The payload is empty, and the email is not in it.** #134 drafted this as `{ email }`, which
 * predates the envelope: the command is about the employee row, the envelope id names it, and
 * the server reads the address off that row. Sending the address as well would make it possible
 * to invite one address while stamping another employee's `user_id` — a disagreement between two
 * facts that only ever has one right answer.
 *
 * It is also the one command in the vocabulary that touches a system outside the transaction,
 * and the worked example `AfterCommit` was designed for (#137): the `users` insert and the
 * `employees.user_id` update commit together or not at all, and the mail goes out afterwards.
 * The old `POST /api/invite` did the reverse — created the login first, then compensated with a
 * hard delete if the link-up failed.
 *
 * It writes `users`, but it lives in `employees`: the domain follows the actor's intent, and
 * only the API knows it is two tables.
 */
export const inviteEmployee = command("inviteEmployee", z.object({}));

export const EMPLOYEE_COMMANDS = [
	addEmployee,
	updateEmployeeDetails,
	deleteEmployee,
	inviteEmployee,
] as const;
