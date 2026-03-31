import { formatDateShort } from "@mcmec/lib/functions/date-fns";
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

export type ContactSubmission = {
	id: string;
	name: string;
	email: string;
	subject: string;
	createdAt: Date;
	isClosed: boolean;
};

interface ContactSubmissionsTableProps {
	data: ContactSubmission[];
}

export function ContactSubmissionsTable({
	data,
}: ContactSubmissionsTableProps) {
	const navigate = useNavigate();
	const [sorting, setSorting] = useState<SortingState>([
		{ desc: true, id: "createdAt" },
	]);

	const columns: ColumnDef<ContactSubmission>[] = [
		{
			accessorKey: "name",
			cell: ({ row }) => {
				return <span className="font-medium">{row.getValue("name")}</span>;
			},
			header: ({ column }) => {
				const sortState = column.getIsSorted();
				return (
					<Button
						className="-ml-4"
						onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
						variant="ghost"
					>
						Name
						{sortState === "asc" ? (
							<ArrowUp className="ml-2 h-4 w-4" />
						) : sortState === "desc" ? (
							<ArrowDown className="ml-2 h-4 w-4" />
						) : (
							<ArrowUpDown className="ml-2 h-4 w-4" />
						)}
					</Button>
				);
			},
		},
		{
			accessorKey: "email",
			header: "Email",
		},
		{
			accessorKey: "subject",
			header: ({ column }) => {
				const sortState = column.getIsSorted();
				return (
					<Button
						className="-ml-4"
						onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
						variant="ghost"
					>
						Subject
						{sortState === "asc" ? (
							<ArrowUp className="ml-2 h-4 w-4" />
						) : sortState === "desc" ? (
							<ArrowDown className="ml-2 h-4 w-4" />
						) : (
							<ArrowUpDown className="ml-2 h-4 w-4" />
						)}
					</Button>
				);
			},
		},
		{
			accessorKey: "createdAt",
			cell: ({ row }) => {
				const date = row.getValue("createdAt") as Date;
				return formatDateShort(date);
			},
			header: ({ column }) => {
				const sortState = column.getIsSorted();
				return (
					<Button
						className="-ml-4"
						onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
						variant="ghost"
					>
						Submitted
						{sortState === "asc" ? (
							<ArrowUp className="ml-2 h-4 w-4" />
						) : sortState === "desc" ? (
							<ArrowDown className="ml-2 h-4 w-4" />
						) : (
							<ArrowUpDown className="ml-2 h-4 w-4" />
						)}
					</Button>
				);
			},
		},
		{
			accessorKey: "isClosed",
			cell: ({ row }) => {
				const isClosed = row.getValue("isClosed") as boolean;
				return (
					<Badge variant={isClosed ? "secondary" : "default"}>
						{isClosed ? "Closed" : "Open"}
					</Badge>
				);
			},
			header: ({ column }) => {
				const sortState = column.getIsSorted();
				return (
					<Button
						className="-ml-4"
						onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
						variant="ghost"
					>
						Status
						{sortState === "asc" ? (
							<ArrowUp className="ml-2 h-4 w-4" />
						) : sortState === "desc" ? (
							<ArrowDown className="ml-2 h-4 w-4" />
						) : (
							<ArrowUpDown className="ml-2 h-4 w-4" />
						)}
					</Button>
				);
			},
		},
	];

	const table = useReactTable({
		columns,
		data,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		initialState: {
			pagination: {
				pageSize: 10,
			},
		},
		onSortingChange: setSorting,
		state: {
			sorting,
		},
	});

	return (
		<div className="space-y-4">
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									return (
										<TableHead key={header.id}>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
										</TableHead>
									);
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									className="cursor-pointer"
									data-state={row.getIsSelected() && "selected"}
									key={row.id}
									onClick={() =>
										navigate({
											params: { submissionId: row.original.id },
											to: "/contact-submissions/$submissionId",
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
						onValueChange={(value) => {
							table.setPageSize(Number(value));
						}}
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
