import { formatDateShort } from "@mcmec/lib/functions/date-fns";
import type { RequestStatus } from "@mcmec/schemas/db/public-requests";
import {
	RecordIndex,
	type RecordIndexColumn,
	type RecordIndexSearch,
	validateRecordIndexSearch,
} from "@mcmec/ui/blocks/record-index";
import { Badge } from "@mcmec/ui/components/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@mcmec/ui/components/select";
import { useLiveQuery } from "@tanstack/react-db";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Inbox } from "lucide-react";
import {
	type DisplayRequestStatus,
	displayStatus,
	REQUEST_STATUS_LABELS,
	REQUEST_STATUS_VARIANTS,
	REQUEST_TYPE_LABELS,
	requestTypeLabel,
} from "@/src/lib/public-requests";

type RequestRow = {
	id: string;
	name: string;
	email: string | null;
	phone: string | null;
	requestType: string;
	status: RequestStatus;
	createdAt: Date;
};

const ALL = "all";

type RequestsSearch = Partial<RecordIndexSearch> & {
	type?: string;
	status?: DisplayRequestStatus;
};

export const Route = createFileRoute("/(app)/public-requests/")({
	component: RouteComponent,
	loader: () => {
		return { crumb: "Public Requests" };
	},
	validateSearch: (raw: Record<string, unknown>): RequestsSearch =>
		validateRecordIndexSearch(raw, (r) => ({
			...(typeof r.type === "string" && r.type !== ALL ? { type: r.type } : {}),
			...(r.status === "new" || r.status === "resolved"
				? { status: r.status }
				: {}),
		})),
});

function RouteComponent() {
	const { db } = Route.useRouteContext();
	const navigate = Route.useNavigate();
	const search = Route.useSearch();

	// One collection for every intake type — filtered here. Requests are created by the public
	// site (POST /api/requests); staff triage them here.
	const { data, collection } = useLiveQuery((q) =>
		q
			.from({ r: db.publicRequests })
			.orderBy(({ r }) => r.created_at, "desc")
			.select(({ r }) => ({
				createdAt: r.created_at,
				email: r.email,
				id: r.id,
				name: r.name,
				phone: r.phone,
				requestType: r.request_type,
				status: r.status,
			})),
	);

	const rows = (data ?? []) as RequestRow[];
	const visible = rows.filter(
		(row) =>
			(!search.type || row.requestType === search.type) &&
			// Compared on the displayed status, so filtering for New also returns a legacy row
			// still holding `in_progress` — which is what the badge beside it now says.
			(!search.status || displayStatus(row.status) === search.status),
	);

	const columns: RecordIndexColumn<RequestRow>[] = [
		{
			cell: (row) => row.name,
			header: "Name",
			id: "name",
			identity: true,
			sortValue: (row) => row.name,
		},
		{
			cell: (row) => (
				<span className="text-muted-foreground">
					{requestTypeLabel(row.requestType)}
				</span>
			),
			header: "Type",
			id: "requestType",
			sortValue: (row) => requestTypeLabel(row.requestType),
		},
		{
			// A Public Request is anonymous beyond what the submitter typed, so contact is
			// whatever they chose to give — and often only one of the two.
			cell: (row) => (
				<span className="text-muted-foreground">
					{row.email ?? row.phone ?? "no contact given"}
				</span>
			),
			cellClassName: "max-w-[28ch] truncate",
			header: "Contact",
			id: "contact",
			sortValue: (row) => row.email ?? row.phone ?? "",
		},
		{
			cell: (row) => (
				<span className="tabular-nums">{formatDateShort(row.createdAt)}</span>
			),
			header: "Received",
			id: "createdAt",
			sortValue: (row) => row.createdAt,
		},
		{
			cell: (row) => (
				<Badge variant={REQUEST_STATUS_VARIANTS[displayStatus(row.status)]}>
					{REQUEST_STATUS_LABELS[displayStatus(row.status)]}
				</Badge>
			),
			header: "Status",
			id: "status",
			sortValue: (row) => REQUEST_STATUS_LABELS[displayStatus(row.status)],
		},
	];

	const patch = (next: Partial<RequestsSearch>) =>
		navigate({
			search: { ...search, page: 1, ...next },
			to: "/public-requests",
		});

	return (
		<RecordIndex
			columns={columns}
			defaultSort={{ dir: "desc", id: "createdAt" }}
			description="Requests and inquiries submitted from the public website."
			emptyState={{
				description:
					"Requests submitted through the public website's intake forms arrive here for triage.",
				icon: Inbox,
				title: "No requests yet",
			}}
			filters={
				<>
					<Select
						onValueChange={(value) =>
							patch({ type: value === ALL ? undefined : value })
						}
						value={search.type ?? ALL}
					>
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
					<Select
						onValueChange={(value) =>
							patch({
								status:
									value === ALL ? undefined : (value as DisplayRequestStatus),
							})
						}
						value={search.status ?? ALL}
					>
						<SelectTrigger aria-label="Filter by status" className="w-40">
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
				</>
			}
			filtersActive={search.type !== undefined || search.status !== undefined}
			getRowKey={(row) => row.id}
			getRowLabel={(row) =>
				`${row.name}, ${requestTypeLabel(row.requestType)}, ${formatDateShort(row.createdAt)}`
			}
			getSearchText={(row) =>
				`${row.name} ${row.email ?? ""} ${row.phone ?? ""} ${requestTypeLabel(row.requestType)}`
			}
			onClearFilters={() => patch({ status: undefined, type: undefined })}
			onSearchChange={(next) =>
				navigate({
					search: { ...search, ...next },
					to: "/public-requests",
				})
			}
			renderRowLink={({ row, className, children }) => (
				<Link
					className={className}
					params={{ requestId: row.id }}
					to="/public-requests/$requestId"
				>
					{children}
				</Link>
			)}
			rows={visible}
			search={search}
			searchPlaceholder="Search requests"
			state={collection.isReady() ? "ready" : "loading"}
			title="Public Requests"
		/>
	);
}
