import { formatDateShort } from "@mcmec/lib/functions/date-fns";
import type { RequestStatus } from "@mcmec/supabase/db/public-requests";
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
import { useNavigate } from "@tanstack/react-router";
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
import {
	REQUEST_STATUS_LABELS,
	REQUEST_STATUS_VARIANTS,
	REQUEST_TYPE_LABELS,
	requestTypeLabel,
} from "@/src/lib/public-requests";

export type PublicRequestRow = {
	id: string;
	requestType: string;
	name: string;
	email: string | null;
	phone: string | null;
	status: RequestStatus;
	createdAt: Date;
};

interface PublicRequestsTableProps {
	data: PublicRequestRow[];
}

function SortableHeader({
	column,
	label,
}: {
	// biome-ignore lint/suspicious/noExplicitAny: TanStack Table's Column generic isn't worth threading here
	column: any;
	label: string;
}) {
	const sortState = column.getIsSorted();
	return (
		<Button
			className="-ml-4"
			onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
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

const ALL = "all";

export function PublicRequestsTable({ data }: PublicRequestsTableProps) {
	const navigate = useNavigate();
	const [sorting, setSorting] = useState<SortingState>([
		{ desc: true, id: "createdAt" },
	]);
	const [typeFilter, setTypeFilter] = useState<string>(ALL);
	const [statusFilter, setStatusFilter] = useState<string>(ALL);

	const filtered = data.filter(
		(r) =>
			(typeFilter === ALL || r.requestType === typeFilter) &&
			(statusFilter === ALL || r.status === statusFilter),
	);

	const columns: ColumnDef<PublicRequestRow>[] = [
		{
			accessorKey: "name",
			cell: ({ row }) => (
				<span className="font-medium">{row.getValue("name")}</span>
			),
			header: ({ column }) => <SortableHeader column={column} label="Name" />,
		},
		{
			accessorKey: "requestType",
			cell: ({ row }) => requestTypeLabel(row.getValue("requestType")),
			header: ({ column }) => <SortableHeader column={column} label="Type" />,
		},
		{
			accessorKey: "email",
			cell: ({ row }) => row.getValue("email") || "—",
			header: ({ column }) => <SortableHeader column={column} label="Email" />,
		},
		{
			accessorKey: "phone",
			cell: ({ row }) => row.getValue("phone") || "—",
			header: "Phone",
		},
		{
			accessorKey: "createdAt",
			cell: ({ row }) => formatDateShort(row.getValue("createdAt")),
			header: ({ column }) => (
				<SortableHeader column={column} label="Submitted" />
			),
		},
		{
			accessorKey: "status",
			cell: ({ row }) => {
				const status = row.getValue("status") as RequestStatus;
				return (
					<Badge variant={REQUEST_STATUS_VARIANTS[status]}>
						{REQUEST_STATUS_LABELS[status]}
					</Badge>
				);
			},
			header: ({ column }) => <SortableHeader column={column} label="Status" />,
		},
	];

	const table = useReactTable({
		columns,
		data: filtered,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		initialState: { pagination: { pageSize: 10 } },
		onSortingChange: setSorting,
		state: { sorting },
	});

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center gap-2">
				<Select onValueChange={setTypeFilter} value={typeFilter}>
					<SelectTrigger aria-label="Filter by request type" className="w-52">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={ALL}>All types</SelectItem>
						{Object.entries(REQUEST_TYPE_LABELS).map(([value, label]) => (
							<SelectItem key={value} value={value}>
								{label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Select onValueChange={setStatusFilter} value={statusFilter}>
					<SelectTrigger aria-label="Filter by status" className="w-44">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={ALL}>All statuses</SelectItem>
						{Object.entries(REQUEST_STATUS_LABELS).map(([value, label]) => (
							<SelectItem key={value} value={value}>
								{label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<p className="text-muted-foreground text-sm">
					{filtered.length} of {data.length} requests
				</p>
			</div>

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
								<TableRow
									className="cursor-pointer"
									key={row.id}
									onClick={() =>
										navigate({
											params: { requestId: row.original.id },
											to: "/public-requests/$requestId",
										})
									}
								>
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
							<SelectValue placeholder={table.getState().pagination.pageSize} />
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
	);
}
