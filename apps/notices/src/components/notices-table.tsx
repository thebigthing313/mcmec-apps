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
import { Link } from "@tanstack/react-router";
import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { useState } from "react";

type Notice = {
	id: string;
	title: string;
	noticeTypeId: string;
	noticeType: string;
	noticeDate: Date;
	creator: string | null | undefined;
	isPublished: boolean;
	isArchived: boolean;
};

interface NoticesTableProps {
	data: Notice[];
}

function getPublicationStatus(
	isPublished: boolean,
	isArchived: boolean,
	noticeDate: Date,
): { label: string; variant: "default" | "secondary" | "outline" } {
	if (!isPublished) {
		return { label: "Draft", variant: "outline" };
	}

	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const notice = new Date(noticeDate);
	notice.setHours(0, 0, 0, 0);

	if (notice <= today) {
		if (isArchived) {
			return { label: "Archived", variant: "secondary" };
		} else {
			return { label: "Published", variant: "default" };
		}
	}

	return { label: "Pending", variant: "secondary" };
}

export function NoticesTable({ data }: NoticesTableProps) {
	const [sorting, setSorting] = useState<SortingState>([]);

	const columns: ColumnDef<Notice>[] = [
		{
			accessorKey: "title",
			cell: ({ row }) => {
				return (
					<Link
						className="font-medium text-primary hover:underline"
						params={{ noticeId: row.original.id }}
						to="/notices/$noticeId"
					>
						{row.getValue("title")}
					</Link>
				);
			},
			header: ({ column }) => {
				return (
					<Button
						className="-ml-4"
						onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
						variant="ghost"
					>
						Title
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				);
			},
		},
		{
			accessorKey: "noticeType",
			header: ({ column }) => {
				return (
					<Button
						className="-ml-4"
						onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
						variant="ghost"
					>
						Notice Type
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				);
			},
		},
		{
			accessorKey: "noticeDate",
			cell: ({ row }) => {
				const date = row.getValue("noticeDate") as Date;
				return new Date(date).toLocaleDateString();
			},
			header: ({ column }) => {
				return (
					<Button
						className="-ml-4"
						onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
						variant="ghost"
					>
						Notice Date
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				);
			},
		},
		{
			accessorKey: "creator",
			cell: ({ row }) => {
				return row.getValue("creator") || "—";
			},
			header: ({ column }) => {
				return (
					<Button
						className="-ml-4"
						onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
						variant="ghost"
					>
						Creator
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				);
			},
		},
		{
			accessorKey: "isPublished",
			cell: ({ row }) => {
				const isPublished = row.getValue("isPublished") as boolean;
				const isArchived = row.original.isArchived;
				const noticeDate = row.original.noticeDate;
				const status = getPublicationStatus(
					isPublished,
					isArchived,
					noticeDate,
				);

				return <Badge variant={status.variant}>{status.label}</Badge>;
			},
			header: ({ column }) => {
				return (
					<Button
						className="-ml-4"
						onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
						variant="ghost"
					>
						Status
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				);
			},
			sortingFn: (rowA, rowB) => {
				const statusA = getPublicationStatus(
					rowA.original.isPublished,
					rowA.original.isArchived,
					rowA.original.noticeDate,
				);
				const statusB = getPublicationStatus(
					rowB.original.isPublished,
					rowB.original.isArchived,
					rowB.original.noticeDate,
				);
				return statusA.label.localeCompare(statusB.label);
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
									data-state={row.getIsSelected() && "selected"}
									key={row.id}
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
