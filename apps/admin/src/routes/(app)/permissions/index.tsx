import type { Claims } from "@mcmec/auth/types";
import { Button } from "@mcmec/ui/components/button";
import { Checkbox } from "@mcmec/ui/components/checkbox";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@mcmec/ui/components/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@mcmec/ui/components/table";
import { eq, isNull, not, useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useState } from "react";
import { useDb } from "@/src/lib/db";

export const Route = createFileRoute("/(app)/permissions/")({
	component: PermissionsPage,
});

type EmployeePermRow = {
	currentUserId: string;
	display_name: string;
	email: string;
	user_id: string;
	admin_rights: string;
	manage_employees: string;
	public_notices: string;
};

function SortableHeader({
	column,
	label,
}: {
	column: {
		getIsSorted: () => false | "asc" | "desc";
		toggleSorting: (desc: boolean) => void;
	};
	label: string;
}) {
	const sortState = column.getIsSorted();
	return (
		<Button
			className="-ml-4"
			onClick={() => column.toggleSorting(sortState === "asc")}
			variant="ghost"
		>
			{label}
			{sortState === "asc" ? (
				<ArrowUp className="ml-2 h-4 w-4" />
			) : sortState === "desc" ? (
				<ArrowDown className="ml-2 h-4 w-4" />
			) : (
				<ArrowUpDown className="ml-2 h-4 w-4" />
			)}
		</Button>
	);
}

function PermissionCell({
	userId,
	permissionName,
	currentUserId,
}: {
	userId: string;
	permissionName: string;
	currentUserId: string;
}) {
	const { userPermissions } = useDb();

	const { data: matches, isLoading } = useLiveQuery(
		(q) =>
			q
				.from({ up: userPermissions })
				.where(({ up }) => eq(up.user_id, userId))
				.where(({ up }) => eq(up.permission_name, permissionName))
				.select(({ up }) => ({
					id: up.id,
				})),
		[userId, permissionName],
	);

	const match = matches?.[0];

	// Prevent removing your own admin_rights (self-demotion)
	const isSelfAdmin =
		userId === currentUserId && permissionName === "admin_rights";

	if (isLoading) return <Checkbox checked={isSelfAdmin} disabled />;

	const handleChange = () => {
		if (match) {
			userPermissions.delete(match.id);
		} else {
			userPermissions.insert({
				id: crypto.randomUUID(),
				user_id: userId,
				permission_name: permissionName,
				created_at: new Date(),
				updated_at: new Date(),
				created_by: null,
				updated_by: null,
			});
		}
	};

	return (
		<Checkbox
			checked={!!match}
			disabled={isSelfAdmin}
			onCheckedChange={handleChange}
		/>
	);
}

const columns: ColumnDef<EmployeePermRow>[] = [
	{
		accessorKey: "display_name",
		header: ({ column }) => <SortableHeader column={column} label="Employee" />,
	},
	{
		accessorKey: "email",
		header: ({ column }) => <SortableHeader column={column} label="Email" />,
	},
	{
		accessorKey: "public_notices",
		cell: ({ row }) => (
			<PermissionCell
				currentUserId={row.original.currentUserId}
				permissionName={row.original.public_notices}
				userId={row.original.user_id}
			/>
		),
		header: "public_notices",
	},
	{
		accessorKey: "manage_employees",
		cell: ({ row }) => (
			<PermissionCell
				currentUserId={row.original.currentUserId}
				permissionName={row.original.manage_employees}
				userId={row.original.user_id}
			/>
		),
		header: "manage_employees",
	},
	{
		accessorKey: "admin_rights",
		cell: ({ row }) => (
			<PermissionCell
				currentUserId={row.original.currentUserId}
				permissionName={row.original.admin_rights}
				userId={row.original.user_id}
			/>
		),
		header: "admin_rights",
	},
];

function PermissionsPage() {
	const { claims } = Route.useRouteContext();
	const { userId: currentUserId } = claims as Claims;
	const { employees } = useDb();
	const [sorting, setSorting] = useState<SortingState>([
		{ desc: false, id: "display_name" },
	]);

	// Only employees with accounts can have permissions
	const { data: linkedEmployees } = useLiveQuery((q) =>
		q
			.from({ emp: employees })
			.where(({ emp }) => not(isNull(emp.user_id)))
			.select(({ emp }) => ({
				currentUserId,
				display_name: emp.display_name,
				email: emp.email,
				user_id: emp.user_id,
				admin_rights: "admin_rights" as const,
				manage_employees: "manage_employees" as const,
				public_notices: "public_notices" as const,
			})),
	);

	const tableData = (linkedEmployees ?? []) as EmployeePermRow[];

	const table = useReactTable({
		columns,
		data: tableData,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		initialState: {
			pagination: { pageSize: 10 },
		},
		onSortingChange: setSorting,
		state: { sorting },
	});

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="font-bold text-2xl">Manage Permissions</h1>
				<p className="text-muted-foreground">
					Assign or revoke permissions for employees with accounts.
				</p>
			</div>

			{tableData.length === 0 ? (
				<div className="rounded-md border p-8 text-center text-muted-foreground">
					No employees with active accounts found. Invite employees via the HR
					app first.
				</div>
			) : (
				<div className="space-y-4">
					<div className="rounded-md border">
						<Table>
							<TableHeader>
								{table.getHeaderGroups().map((headerGroup) => (
									<TableRow key={headerGroup.id}>
										{headerGroup.headers.map((header) => (
											<TableHead key={header.id}>
												{header.isPlaceholder
													? null
													: flexRender(
															header.column.columnDef.header,
															header.getContext(),
														)}
											</TableHead>
										))}
									</TableRow>
								))}
							</TableHeader>
							<TableBody>
								{table.getRowModel().rows?.length ? (
									table.getRowModel().rows.map((row) => (
										<TableRow key={row.id}>
											{row.getVisibleCells().map((cell) => (
												<TableCell key={cell.id}>
													{flexRender(
														cell.column.columnDef.cell,
														cell.getContext(),
													)}
												</TableCell>
											))}
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell
											className="h-24 text-center"
											colSpan={columns.length}
										>
											No results.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>

					<div className="flex items-center justify-between px-2">
						<div className="flex items-center space-x-2">
							<p className="text-muted-foreground text-sm">Rows per page</p>
							<Select
								onValueChange={(value) => table.setPageSize(Number(value))}
								value={`${table.getState().pagination.pageSize}`}
							>
								<SelectTrigger className="h-8 w-17.5">
									<SelectValue
										placeholder={table.getState().pagination.pageSize}
									/>
								</SelectTrigger>
								<SelectContent side="top">
									{[10, 20, 30, 40, 50].map((pageSize) => (
										<SelectItem key={pageSize} value={`${pageSize}`}>
											{pageSize}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="flex items-center space-x-6 lg:space-x-8">
							<div className="flex w-25 items-center justify-center font-medium text-sm">
								Page {table.getState().pagination.pageIndex + 1} of{" "}
								{table.getPageCount()}
							</div>
							<div className="flex items-center space-x-2">
								<Button
									disabled={!table.getCanPreviousPage()}
									onClick={() => table.previousPage()}
									size="sm"
									variant="outline"
								>
									Previous
								</Button>
								<Button
									disabled={!table.getCanNextPage()}
									onClick={() => table.nextPage()}
									size="sm"
									variant="outline"
								>
									Next
								</Button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
