import {
	type EmployeeRow,
	EmployeesIndex,
} from "@mcmec/ui/blocks/employees-index";
import { useLiveQuery } from "@tanstack/react-db";
import { getRouteApi, Link } from "@tanstack/react-router";
import { AddEmployeeDialog } from "./add-employee-dialog";
import { sendInvite } from "./send-invite";

const route = getRouteApi("/(app)/hr/employees/");

/** `/hr/employees`: every Employee, with Add and Invite. Moved from the old `hr` app's `/employees`. */
export function EmployeesPage() {
	const { apiUrl, employees } = route.useRouteContext();
	const navigate = route.useNavigate();
	const search = route.useSearch();

	const { data, collection } = useLiveQuery(
		(q) =>
			q.from({ employee: employees }).select(({ employee }) => ({
				displayName: employee.display_name,
				displayTitle: employee.display_title,
				email: employee.email,
				id: employee.id,
				userId: employee.user_id,
			})),
		[employees],
	);

	return (
		<EmployeesIndex
			actions={<AddEmployeeDialog employees={employees} />}
			onInvite={(employeeId) => sendInvite(apiUrl, employeeId)}
			onSearchChange={(next) =>
				navigate({
					search: { ...search, ...next },
					to: "/hr/employees",
				})
			}
			renderRowLink={({ row, className, children }) => (
				<Link
					className={className}
					params={{ employeeId: row.id }}
					to="/hr/employees/$employeeId"
				>
					{children}
				</Link>
			)}
			rows={(data ?? []) as EmployeeRow[]}
			search={search}
			state={collection.isReady() ? "ready" : "loading"}
		/>
	);
}
