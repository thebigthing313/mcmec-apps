import { formatDateTime } from "@mcmec/lib/functions/date-fns";
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

export type MeetingTableRowType = {
	id: string;
	name: string;
	meetingAt: Date;
	isCancelled: boolean;
	agendaUrl: string | null | undefined;
	minutesUrl: string | null | undefined;
	reportUrl: string | null | undefined;
	noticeUrl: string | null | undefined;
	notes: string | null | undefined;
};

interface MeetingsTableProps {
	data: MeetingTableRowType[];
	linkToDetail?: boolean;
	onRowClick?: (meetingId: string) => void;
}

export function MeetingsTable({
	data,
	linkToDetail = false,
	onRowClick,
}: MeetingsTableProps) {
	const [sorting, setSorting] = useState<SortingState>([
		{
			desc: true,
			id: "meetingAt",
		},
		{ desc: false, id: "name" },
	]);

	const columns: ColumnDef<MeetingTableRowType>[] = [
		{
			accessorKey: "name",
			cell: ({ row }) => {
				const name = row.getValue("name") as string;
				if (linkToDetail && onRowClick) {
					return (
						<button
							className="text-left font-medium text-primary hover:underline"
							onClick={() => onRowClick(row.original.id)}
							type="button"
						>
							{name}
						</button>
					);
				}
				return <span className="font-medium">{name}</span>;
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
			accessorKey: "meetingAt",
			cell: ({ row }) => {
				const date = row.getValue("meetingAt") as Date;
				return formatDateTime(date);
			},
			header: ({ column }) => {
				const sortState = column.getIsSorted();
				return (
					<Button
						className="-ml-4"
						onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
						variant="ghost"
					>
						Meeting Date & Time
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
			accessorKey: "isCancelled",
			cell: ({ row }) => {
				const isCancelled = row.getValue("isCancelled") as boolean;
				const meetingAt = row.getValue("meetingAt") as Date;
				const now = new Date();
				const hasPassed = meetingAt < now;

				let status: string;
				let variant: "default" | "secondary" | "outline";

				if (isCancelled) {
					status = "Cancelled";
					variant = "secondary";
				} else if (hasPassed) {
					status = "Past";
					variant = "outline";
				} else {
					status = "Pending";
					variant = "default";
				}

				return <Badge variant={variant}>{status}</Badge>;
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
		{
			cell: ({ row }) => {
				const { agendaUrl, minutesUrl, reportUrl, noticeUrl } = row.original;
				const links = [
					{ label: "Agenda", url: agendaUrl },
					{ label: "Minutes", url: minutesUrl },
					{ label: "Report", url: reportUrl },
					{ label: "48-Hour Notice", url: noticeUrl },
				].filter((link) => link.url);

				if (links.length === 0) {
					return "—";
				}

				return (
					<div className="flex flex-wrap gap-2">
						{links.map((link) => (
							<a
								className="text-primary text-sm hover:underline"
								href={link.url as string}
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
			header: "Links",
			id: "links",
		},
		{
			accessorKey: "notes",
			cell: ({ row }) => {
				const notes = row.getValue("notes") as string | null;
				return notes ? <span className="text-sm">{notes}</span> : "—";
			},
			header: "Notes",
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
