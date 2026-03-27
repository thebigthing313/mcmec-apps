import { Badge } from "@mcmec/ui/components/badge";
import { Button } from "@mcmec/ui/components/button";
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
import { useLiveQuery } from "@tanstack/react-db";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Mail } from "lucide-react";
import { useState } from "react";
import { AddEmployeeDialog } from "@/src/components/add-employee-dialog";
import { useDb } from "@/src/lib/db";

export const Route = createFileRoute("/(app)/employees/")({
	component: EmployeesPage,
});

type Employee = {
	display_name: string;
	display_title: string | null;
	email: string;
	id: string;
	user_id: string | null;
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

function InviteButton({ email }: { email: string }) {
	const [loading, setLoading] = useState(false);
	const [sent, setSent] = useState(false);

	async function handleInvite() {
		setLoading(true);
		try {
			const res = await fetch(
				`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-employee`,
				{
					body: JSON.stringify({ email }),
					headers: {
						Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
						"Content-Type": "application/json",
					},
					method: "POST",
				},
			);
			const data = await res.json();
			if (data.success) {
				setSent(true);
			} else {
				console.error("Invite failed:", data.error);
			}
		} catch (err) {
			console.error("Invite error:", err);
		} finally {
			setLoading(false);
		}
	}

	if (sent) {
		return <Badge variant="outline">Invite Sent</Badge>;
	}

	return (
		<Button
			disabled={loading}
			onClick={handleInvite}
			size="sm"
			variant="outline"
		>
			<Mail className="mr-1 h-3 w-3" />
			{loading ? "Sending..." : "Send Invite"}
		</Button>
	);
}

const columns: ColumnDef<Employee>[] = [
	{
		accessorKey: "display_name",
		cell: ({ row }) => (
			<Link
				className="font-medium text-primary hover:underline"
				params={{ employeeId: row.original.id }}
				to="/employees/$employeeId"
			>
				{row.getValue("display_name")}
			</Link>
		),
		header: ({ column }) => <SortableHeader column={column} label="Name" />,
	},
	{
		accessorKey: "email",
		header: ({ column }) => <SortableHeader column={column} label="Email" />,
	},
	{
		accessorKey: "display_title",
		cell: ({ row }) => row.getValue("display_title") || "—",
		header: ({ column }) => <SortableHeader column={column} label="Title" />,
	},
	{
		accessorKey: "user_id",
		cell: ({ row }) => {
			const userId = row.getValue("user_id") as string | null;
			return userId ? (
				<Badge variant="default">Active</Badge>
			) : (
				<Badge variant="secondary">No Account</Badge>
			);
		},
		header: ({ column }) => (
			<SortableHeader column={column} label="Account Status" />
		),
		sortingFn: (rowA, rowB) => {
			const a = rowA.original.user_id ? 1 : 0;
			const b = rowB.original.user_id ? 1 : 0;
			return a - b;
		},
	},
	{
		cell: ({ row }) => {
			if (row.original.user_id) return null;
			return <InviteButton email={row.original.email} />;
		},
		header: "Actions",
		id: "actions",
	},
];

function EmployeesPage() {
	const { employees } = useDb();
	const [sorting, setSorting] = useState<SortingState>([
		{ desc: false, id: "display_name" },
	]);

	const { data: employeeList } = useLiveQuery((q) =>
		q.from({ employee: employees }).select(({ employee }) => ({
			display_name: employee.display_name,
			display_title: employee.display_title,
			email: employee.email,
			id: employee.id,
			user_id: employee.user_id,
		})),
	);

	const table = useReactTable({
		columns,
		data: employeeList ?? [],
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
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl">Manage Employees</h1>
					<p className="text-muted-foreground">
						View and manage employee records.
					</p>
				</div>
				<AddEmployeeDialog />
			</div>

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
										No employees found.
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
		</div>
	);
}
