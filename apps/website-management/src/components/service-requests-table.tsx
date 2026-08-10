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

export type ServiceRequestType =
	| "adult-mosquito"
	| "mosquitofish"
	| "water-management";

export type ServiceRequest = {
	id: string;
	fullName: string;
	email: string | null;
	phone: string;
	createdAt: Date;
	isProcessed: boolean;
	type: ServiceRequestType;
};

interface ServiceRequestsTableProps {
	data: ServiceRequest[];
}

function getRequestTypeLabel(type: ServiceRequestType): string {
	switch (type) {
		case "adult-mosquito":
			return "Adult Mosquito";
		case "mosquitofish":
			return "Mosquitofish";
		case "water-management":
			return "Water Management";
	}
}

function getDetailRoute(
	type: ServiceRequestType,
):
	| "/service-requests/adult-mosquito/$requestId"
	| "/service-requests/mosquitofish/$requestId"
	| "/service-requests/water-management/$requestId" {
	switch (type) {
		case "adult-mosquito":
			return "/service-requests/adult-mosquito/$requestId";
		case "mosquitofish":
			return "/service-requests/mosquitofish/$requestId";
		case "water-management":
			return "/service-requests/water-management/$requestId";
	}
}

export function ServiceRequestsTable({ data }: ServiceRequestsTableProps) {
	const navigate = useNavigate();
	const [sorting, setSorting] = useState<SortingState>([
		{ desc: true, id: "createdAt" },
	]);

	const columns: ColumnDef<ServiceRequest>[] = [
		{
			accessorKey: "fullName",
			cell: ({ row }) => {
				return <span className="font-medium">{row.getValue("fullName")}</span>;
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
			accessorKey: "type",
			cell: ({ row }) => {
				return getRequestTypeLabel(row.getValue("type"));
			},
			header: ({ column }) => {
				const sortState = column.getIsSorted();
				return (
					<Button
						className="-ml-4"
						onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
						variant="ghost"
					>
						Type
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
			cell: ({ row }) => row.getValue("email") || "—",
			header: "Email",
		},
		{
			accessorKey: "phone",
			header: "Phone",
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
			accessorKey: "isProcessed",
			cell: ({ row }) => {
				const isProcessed = row.getValue("isProcessed") as boolean;
				return (
					<Badge variant={isProcessed ? "default" : "secondary"}>
						{isProcessed ? "Processed" : "Pending"}
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
											params: { requestId: row.original.id },
											to: getDetailRoute(row.original.type),
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
