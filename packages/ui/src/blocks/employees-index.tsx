import { UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "../components/badge";
import { InviteButton } from "./invite-button";
import {
	RecordIndex,
	type RecordIndexColumn,
	type RecordIndexSearch,
} from "./record-index";

/**
 * The Employees index, rendered identically by `hr` and by `admin`.
 *
 * These two routes were byte-identical 250-line files — the same columns, the same private
 * `SortableHeader`, the same pagination footer, copied between applications. Employees are one
 * bounded context read by two surfaces, so the screen belongs here beside the other domain blocks
 * (`meetings-table`, `insecticides-table`, `public-notice-card`) rather than twice in `apps/`.
 *
 * What each application still supplies is what genuinely differs: its own typed link to its own
 * employee detail route, its own invite command, and its own "add employee" control.
 */
export interface EmployeeRow {
	id: string;
	displayName: string;
	displayTitle: string | null;
	email: string;
	userId: string | null;
}

export function EmployeesIndex({
	actions,
	onInvite,
	onSearchChange,
	renderRowLink,
	rows,
	search,
	state,
}: {
	/** The application's own "Add Employee" control. */
	actions?: ReactNode;
	/** Sends the invite for one employee. Returns once the request settles. */
	onInvite: (employeeId: string) => Promise<void>;
	onSearchChange: (next: RecordIndexSearch) => void;
	renderRowLink: (args: {
		row: EmployeeRow;
		className: string;
		children: ReactNode;
	}) => ReactNode;
	rows: EmployeeRow[];
	search: Partial<RecordIndexSearch>;
	state: "loading" | "ready";
}) {
	const columns: RecordIndexColumn<EmployeeRow>[] = [
		{
			cell: (row) => row.displayName,
			header: "Name",
			id: "displayName",
			identity: true,
			sortValue: (row) => row.displayName,
		},
		{
			cell: (row) => <span className="text-muted-foreground">{row.email}</span>,
			cellClassName: "max-w-[32ch] truncate",
			header: "Email",
			id: "email",
			sortValue: (row) => row.email,
		},
		{
			cell: (row) =>
				row.displayTitle ?? <span className="text-muted-foreground">—</span>,
			header: "Title",
			id: "displayTitle",
			sortValue: (row) => row.displayTitle,
		},
		{
			// "Active" versus "No Account" is the whole reason this column exists: an employee
			// record and a sign-in account are separate things, and the gap between them is what
			// an invite closes.
			cell: (row) =>
				row.userId ? (
					<Badge variant="default">Active</Badge>
				) : (
					<Badge variant="secondary">No Account</Badge>
				),
			header: "Account",
			id: "userId",
			sortValue: (row) => (row.userId ? "Active" : "No Account"),
		},
	];

	return (
		<RecordIndex
			actions={actions}
			columns={columns}
			defaultSort={{ dir: "asc", id: "displayName" }}
			description="View and manage employee records."
			emptyState={{
				description:
					"Employees added here can be invited to create a sign-in account.",
				icon: UserRound,
				title: "No employees yet",
			}}
			getRowKey={(row) => row.id}
			getRowLabel={(row) => row.displayName}
			getSearchText={(row) =>
				`${row.displayName} ${row.email} ${row.displayTitle ?? ""}`
			}
			onSearchChange={onSearchChange}
			renderRowLink={renderRowLink}
			// A shortcut surface only — ADR 0001. Everything reachable from a row is also
			// reachable from the detail page, and Send Invite is. An employee who already has an
			// account has nothing to offer here, so the menu renders nothing rather than a
			// disabled entry.
			rowActions={(row) =>
				row.userId
					? []
					: [
							{
								label: "Send Invite",
								onAct: () => {
									void onInvite(row.id);
								},
							},
						]
			}
			rows={rows}
			search={search}
			searchPlaceholder="Search employees"
			state={state}
			title="Manage Employees"
		/>
	);
}

/**
 * The invite control as a standalone button, for the detail view.
 *
 * Re-exported here so a screen showing one employee does not have to reach past this block to
 * find it.
 */
export { InviteButton };
