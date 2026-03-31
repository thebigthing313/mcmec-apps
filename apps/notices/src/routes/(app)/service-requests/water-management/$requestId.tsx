import { formatDateShort } from "@mcmec/lib/functions/date-fns";
import { Badge } from "@mcmec/ui/components/badge";
import { Button } from "@mcmec/ui/components/button";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Edit } from "lucide-react";

export const Route = createFileRoute(
	"/(app)/service-requests/water-management/$requestId",
)({
	component: RouteComponent,
	loader: () => {
		return { crumb: "Water Management Request" };
	},
});

function RouteComponent() {
	const { db } = Route.useRouteContext();
	const { requestId } = Route.useParams();

	const { data: request } = useLiveQuery(
		(q) =>
			q
				.from({ r: db.waterManagementRequests })
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

	return (
		<div className="max-w-2xl space-y-6">
			<nav className="flex items-center justify-between rounded-lg border bg-card p-4">
				<Button asChild size="sm" variant="outline">
					<Link to="/service-requests">
						<ArrowLeft />
						Back to Requests
					</Link>
				</Button>
				<Button asChild size="sm" variant="outline">
					<Link
						params={{ requestId: request.id }}
						to="/service-requests/water-management/$requestId/edit"
					>
						<Edit />
						Edit
					</Link>
				</Button>
			</nav>

			<article className="space-y-4">
				<div className="flex items-baseline gap-2">
					<h2 className="font-bold text-2xl">Water Management Request</h2>
					<Badge variant={request.is_processed ? "default" : "secondary"}>
						{request.is_processed ? "Processed" : "Pending"}
					</Badge>
				</div>

				<div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
					<div>
						<p className="text-muted-foreground text-sm">Full Name</p>
						<p className="font-medium">{request.full_name}</p>
					</div>
					<div>
						<p className="text-muted-foreground text-sm">Phone</p>
						<p className="font-medium">{request.phone}</p>
					</div>
					<div>
						<p className="text-muted-foreground text-sm">Email</p>
						<p className="font-medium">{request.email || "—"}</p>
					</div>
					<div>
						<p className="text-muted-foreground text-sm">Submitted</p>
						<p className="font-medium">{formatDateShort(request.created_at)}</p>
					</div>
					<div className="col-span-2">
						<p className="text-muted-foreground text-sm">Address</p>
						<p className="font-medium">
							{request.address_line_1}
							{request.address_line_2 && <>, {request.address_line_2}</>}
						</p>
					</div>
					<div>
						<p className="text-muted-foreground text-sm">Zip Code</p>
						<p className="font-medium">
							{zipCode
								? `${zipCode.code} — ${zipCode.city}, ${zipCode.state}`
								: "—"}
						</p>
					</div>
				</div>

				<div className="rounded-lg border p-4">
					<h3 className="mb-2 font-semibold">Location of Standing Water</h3>
					<div className="flex gap-2">
						{request.is_on_my_property && (
							<Badge variant="outline">On My Property</Badge>
						)}
						{request.is_on_neighbor_property && (
							<Badge variant="outline">On Neighbor's Property</Badge>
						)}
						{request.is_on_public_property && (
							<Badge variant="outline">On Public Property</Badge>
						)}
					</div>
				</div>

				{request.other_location_description && (
					<div className="rounded-lg border p-4">
						<h3 className="mb-2 font-semibold">Other Location Description</h3>
						<p>{request.other_location_description}</p>
					</div>
				)}

				{request.additional_details && (
					<div className="rounded-lg border p-4">
						<h3 className="mb-2 font-semibold">Additional Details</h3>
						<p>{request.additional_details}</p>
					</div>
				)}
			</article>
		</div>
	);
}
