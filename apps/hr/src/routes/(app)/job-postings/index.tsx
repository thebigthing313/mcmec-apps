import {
	getJobPostingStatus,
	type JobPostingStatus,
} from "@mcmec/lib/functions/job-posting-status";
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
import { ArrowDown, ArrowUp, ArrowUpDown, Plus } from "lucide-react";
import { useState } from "react";
import { useDb } from "@/src/lib/db";

export const Route = createFileRoute("/(app)/job-postings/")({
	component: JobPostingsPage,
});

type JobPosting = {
	id: string;
	is_closed: boolean;
	published_at: Date | null;
	title: string;
};

const statusDisplay: Record<
	JobPostingStatus,
	{
		label: string;
		variant: "default" | "destructive" | "outline" | "secondary";
	}
> = {
	closed: { label: "Closed", variant: "destructive" },
	draft: { label: "Draft", variant: "outline" },
	pending: { label: "Pending", variant: "secondary" },
	published: { label: "Published", variant: "default" },
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

const columns: ColumnDef<JobPosting>[] = [
	{
		accessorKey: "title",
		cell: ({ row }) => (
			<Link
				className="font-medium text-primary hover:underline"
				params={{ postingId: row.original.id }}
				to="/job-postings/$postingId"
			>
				{row.getValue("title")}
			</Link>
		),
		header: ({ column }) => <SortableHeader column={column} label="Title" />,
	},
	{
		accessorKey: "published_at",
		cell: ({ row }) => {
			const date = row.getValue("published_at") as Date | null;
			return date ? new Date(date).toLocaleDateString() : "—";
		},
		header: ({ column }) => (
			<SortableHeader column={column} label="Published At" />
		),
	},
	{
		cell: ({ row }) => {
			const status = statusDisplay[getJobPostingStatus(row.original)];
			return <Badge variant={status.variant}>{status.label}</Badge>;
		},
		header: "Status",
		id: "status",
	},
];

function JobPostingsPage() {
	const { jobPostings } = useDb();
	const [sorting, setSorting] = useState<SortingState>([
		{ desc: true, id: "published_at" },
	]);

	const { data: postingList } = useLiveQuery((q) =>
		q.from({ posting: jobPostings }).select(({ posting }) => ({
			id: posting.id,
			is_closed: posting.is_closed,
			published_at: posting.published_at,
			title: posting.title,
		})),
	);

	const table = useReactTable({
		columns,
		data: postingList ?? [],
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
					<h1 className="font-bold text-2xl">Job Postings</h1>
					<p className="text-muted-foreground">
						Create and manage job postings for the public website.
					</p>
				</div>
				<Button asChild>
					<Link to="/job-postings/new">
						<Plus className="mr-1 h-4 w-4" />
						Add Job Posting
					</Link>
				</Button>
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
										No job postings found.
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
