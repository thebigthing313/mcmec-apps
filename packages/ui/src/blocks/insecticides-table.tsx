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

export type InsecticideTableRowType = {
	id: string;
	type_name: string;
	trade_name: string;
	active_ingredient: string;
	label_url: string;
	msds_url: string;
};

interface InsecticidesTableProps {
	data: InsecticideTableRowType[];
	linkToEdit?: boolean;
	onRowClick?: (insecticideId: string) => void;
}

export function InsecticidesTable({
	data,
	linkToEdit = false,
	onRowClick,
}: InsecticidesTableProps) {
	const [sorting, setSorting] = useState<SortingState>([
		{ desc: false, id: "type_name" },
		{ desc: false, id: "trade_name" },
	]);

	const columns: ColumnDef<InsecticideTableRowType>[] = [
		{
			accessorKey: "type_name",
			header: ({ column }) => {
				return (
					<Button
						className="-ml-4"
						onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
						variant="ghost"
					>
						Type
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				);
			},
		},
		{
			accessorKey: "trade_name",
			header: ({ column }) => {
				return (
					<Button
						className="-ml-4"
						onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
						variant="ghost"
					>
						Trade Name
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				);
			},
		},
		{
			accessorKey: "active_ingredient",
			cell: ({ row }) => {
				const activeIngredient = row.getValue("active_ingredient") as string;
				if (linkToEdit && onRowClick) {
					return (
						<button
							className="text-left text-primary hover:underline"
							onClick={() => onRowClick(row.original.id)}
							type="button"
						>
							{activeIngredient}
						</button>
					);
				}
				return activeIngredient;
			},
			header: ({ column }) => {
				return (
					<Button
						className="-ml-4"
						onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
						variant="ghost"
					>
						Active Ingredient
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				);
			},
		},
		{
			cell: ({ row }) => {
				const { label_url, msds_url } = row.original;
				const links = [
					{ label: "Label", url: label_url },
					{ label: "MSDS", url: msds_url },
				].filter((link) => link.url);

				if (links.length === 0) {
					return "—";
				}

				return (
					<div className="flex flex-wrap gap-2">
						{links.map((link) => (
							<a
								className="text-primary text-sm hover:underline"
								href={link.url}
								key={link.label}
								rel="noopener noreferrer"
								target="_blank"
							>
								{link.label}
							</a>
						))}
					</div>
				);
			},
			header: "Documents",
			id: "documents",
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
				pageSize: 20,
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
