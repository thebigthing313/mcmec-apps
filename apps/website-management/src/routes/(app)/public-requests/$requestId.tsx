import { formatDateShort } from "@mcmec/lib/functions/date-fns";
import {
	type RequestStatus,
	RequestStatusEnum,
} from "@mcmec/schemas/db/public-requests";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@mcmec/ui/components/alert-dialog";
import { Badge } from "@mcmec/ui/components/badge";
import { Button } from "@mcmec/ui/components/button";
import { Label } from "@mcmec/ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@mcmec/ui/components/select";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Trash2 } from "lucide-react";
import {
	humanizeDetailKey,
	REQUEST_STATUS_LABELS,
	REQUEST_STATUS_VARIANTS,
	requestTypeLabel,
} from "@/src/lib/public-requests";
import { toastOnError } from "@/src/lib/toast-on-error";

export const Route = createFileRoute("/(app)/public-requests/$requestId")({
	component: RouteComponent,
	loader: () => {
		return { crumb: "Request" };
	},
});

/**
 * `details` is per-type jsonb (the API's discriminated union owns its shape), so render it
 * generically: booleans become present/absent badges, everything else prints as text.
 */
function DetailsPanel({ details }: { details: unknown }) {
	if (!details || typeof details !== "object") return null;
	const entries = Object.entries(details as Record<string, unknown>);
	if (entries.length === 0) return null;

	const flags = entries.filter(([, v]) => typeof v === "boolean");
	const values = entries.filter(
		([, v]) => typeof v !== "boolean" && v !== null && v !== "",
	);

	return (
		<div className="space-y-4">
			{flags.length > 0 && (
				<div className="rounded-lg border p-4">
					<h3 className="mb-2 font-semibold">Reported</h3>
					<div className="flex flex-wrap gap-2">
						{flags.map(([key, value]) => (
							<Badge key={key} variant={value ? "default" : "outline"}>
								{humanizeDetailKey(key)}
								{value ? "" : ": No"}
							</Badge>
						))}
					</div>
				</div>
			)}

			{values.map(([key, value]) => (
				<div className="rounded-lg border p-4" key={key}>
					<h3 className="mb-2 font-semibold">{humanizeDetailKey(key)}</h3>
					<p className="whitespace-pre-wrap">{String(value)}</p>
				</div>
			))}
		</div>
	);
}

function RouteComponent() {
	const navigate = Route.useNavigate();
	const { db } = Route.useRouteContext();
	const { requestId } = Route.useParams();

	const { data: request } = useLiveQuery(
		(q) =>
			q
				.from({ r: db.publicRequests })
				.where(({ r }) => eq(r.id, requestId))
				.findOne(),
		[requestId],
	);

	const { data: zipCode } = useLiveQuery(
		(q) =>
			q
				.from({ zc: db.zipCodes })
				.where(({ zc }) => eq(zc.id, request?.zip_code_id ?? ""))
				.findOne(),
		[request?.zip_code_id],
	);

	if (!request) {
		return null;
	}

	const status = request.status as RequestStatus;

	const handleStatusChange = (next: string) => {
		const parsed = RequestStatusEnum.safeParse(next);
		if (!parsed.success) return;
		const tx = db.publicRequests.update(requestId, (draft) => {
			draft.status = parsed.data;
		});
		toastOnError(tx, "Failed to update the request status.");
	};

	const handleDelete = () => {
		const tx = db.publicRequests.delete(requestId);
		toastOnError(tx, "Failed to delete the request.");
		navigate({ to: "/public-requests" });
	};

	return (
		<div className="max-w-2xl space-y-6">
			<nav className="flex items-center justify-between rounded-lg border bg-card p-4">
				<Button asChild size="sm" variant="outline">
					<Link to="/public-requests">
						<ArrowLeft />
						Back to Requests
					</Link>
				</Button>
			</nav>

			<article className="space-y-4">
				<div className="flex items-baseline gap-2">
					<h2 className="font-bold text-2xl">
						{requestTypeLabel(request.request_type)}
					</h2>
					<Badge variant={REQUEST_STATUS_VARIANTS[status]}>
						{REQUEST_STATUS_LABELS[status]}
					</Badge>
				</div>

				<div className="flex max-w-xs flex-col gap-2">
					<Label htmlFor="status">Status</Label>
					<Select onValueChange={handleStatusChange} value={status}>
						<SelectTrigger id="status">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{Object.entries(REQUEST_STATUS_LABELS).map(([value, label]) => (
								<SelectItem key={value} value={value}>
									{label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
					<div>
						<p className="text-muted-foreground text-sm">Name</p>
						<p className="font-medium">{request.name}</p>
					</div>
					<div>
						<p className="text-muted-foreground text-sm">Phone</p>
						<p className="font-medium">{request.phone || "—"}</p>
					</div>
					<div>
						<p className="text-muted-foreground text-sm">Email</p>
						<p className="font-medium">{request.email || "—"}</p>
					</div>
					<div>
						<p className="text-muted-foreground text-sm">Submitted</p>
						<p className="font-medium">{formatDateShort(request.created_at)}</p>
					</div>
					{request.address_line_1 && (
						<div className="col-span-2">
							<p className="text-muted-foreground text-sm">Address</p>
							<p className="font-medium">
								{request.address_line_1}
								{request.address_line_2 && <>, {request.address_line_2}</>}
							</p>
						</div>
					)}
					{request.zip_code_id && (
						<div>
							<p className="text-muted-foreground text-sm">Zip Code</p>
							<p className="font-medium">
								{zipCode
									? `${zipCode.code} — ${zipCode.city}, ${zipCode.state}`
									: "—"}
							</p>
						</div>
					)}
				</div>

				<DetailsPanel details={request.details} />

				<AlertDialog>
					<AlertDialogTrigger asChild>
						<Button variant="destructive">
							<Trash2 />
							Delete Request
						</Button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Delete this request?</AlertDialogTitle>
							<AlertDialogDescription>
								This permanently removes the submission, including the
								submitter's contact details. This cannot be undone.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction onClick={handleDelete}>
								Delete
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</article>
		</div>
	);
}
