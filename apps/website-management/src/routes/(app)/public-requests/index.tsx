import type { RequestStatus } from "@mcmec/schemas/db/public-requests";
import { useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import {
	type PublicRequestRow,
	PublicRequestsTable,
} from "@/src/components/public-requests-table";

export const Route = createFileRoute("/(app)/public-requests/")({
	component: RouteComponent,
	loader: () => {
		return { crumb: "All Requests" };
	},
});

function RouteComponent() {
	const { db } = Route.useRouteContext();

	// One collection for every intake type — the table filters by request_type. Requests are
	// created by the public site (POST /api/requests); staff triage them here.
	const { data: requests } = useLiveQuery((q) =>
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

	return (
		<div className="flex flex-col gap-4">
			<div>
				<h1 className="font-bold text-2xl">Public Requests</h1>
				<p className="text-muted-foreground">
					Service requests and inquiries submitted from the public website.
				</p>
			</div>
			<PublicRequestsTable
				data={
					(requests ?? []) as (PublicRequestRow & { status: RequestStatus })[]
				}
			/>
		</div>
	);
}
