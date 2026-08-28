import {
	type EmployeeRow,
	EmployeesIndex,
} from "@mcmec/ui/blocks/employees-index";
import type { RecordIndexSearch } from "@mcmec/ui/blocks/record-index";
import { useLiveQuery } from "@tanstack/react-db";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AddEmployeeDialog } from "@/src/components/add-employee-dialog";
import { useDb } from "@/src/lib/db";
import { sendInvite } from "@/src/lib/employees";

export const Route = createFileRoute("/(app)/employees/")({
	component: EmployeesPage,
	loader: () => ({ crumb: "Manage Employees" }),
	validateSearch: (
		raw: Partial<Record<keyof RecordIndexSearch, unknown>>,
	): Partial<RecordIndexSearch> => ({
		...(typeof raw.q === "string" && raw.q ? { q: raw.q } : {}),
		...(Number(raw.page) > 1 ? { page: Number(raw.page) } : {}),
		...(Number(raw.size) ? { size: Number(raw.size) } : {}),
		...(typeof raw.sort === "string" && raw.sort ? { sort: raw.sort } : {}),
		...(raw.dir === "asc" || raw.dir === "desc" ? { dir: raw.dir } : {}),
	}),
});

function EmployeesPage() {
	const { employees } = useDb();
	const navigate = Route.useNavigate();
	const search = Route.useSearch();

	const { data, collection } = useLiveQuery((q) =>
		q.from({ employee: employees }).select(({ employee }) => ({
			displayName: employee.display_name,
			displayTitle: employee.display_title,
			email: employee.email,
			id: employee.id,
			userId: employee.user_id,
		})),
	);

	return (
		<EmployeesIndex
			actions={<AddEmployeeDialog />}
			onInvite={sendInvite}
			onSearchChange={(next) =>
				navigate({
					search: { ...search, ...next },
					to: "/employees",
				})
			}
			renderRowLink={({ row, className, children }) => (
				<Link
					className={className}
					params={{ employeeId: row.id }}
					to="/employees/$employeeId"
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
