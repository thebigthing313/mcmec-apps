import { Button } from "@mcmec/ui/components/button";
import { useLiveQuery } from "@tanstack/react-db";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import {
	type ServiceRequest,
	ServiceRequestsTable,
} from "@/src/components/service-requests-table";

export const Route = createFileRoute("/(app)/service-requests/")({
	component: RouteComponent,
	loader: () => {
		return { crumb: "All Requests" };
	},
});

function RouteComponent() {
	const navigate = useNavigate();
	const { db } = Route.useRouteContext();

	const { data: adultMosquito } = useLiveQuery((q) =>
		q
			.from({ r: db.adultMosquitoRequests })
			.orderBy(({ r }) => r.created_at, "desc"),
	);

	const { data: mosquitofish } = useLiveQuery((q) =>
		q
			.from({ r: db.mosquitofishRequests })
			.orderBy(({ r }) => r.created_at, "desc"),
	);

	const { data: waterManagement } = useLiveQuery((q) =>
		q
			.from({ r: db.waterManagementRequests })
			.orderBy(({ r }) => r.created_at, "desc"),
	);

	const mappedData: ServiceRequest[] = [
		...adultMosquito.map((r) => ({
			createdAt: r.created_at,
			email: r.email,
			fullName: r.full_name,
			id: r.id,
			isProcessed: r.is_processed,
			phone: r.phone,
			type: "adult-mosquito" as const,
		})),
		...mosquitofish.map((r) => ({
			createdAt: r.created_at,
			email: r.email,
			fullName: r.full_name,
			id: r.id,
			isProcessed: r.is_processed,
			phone: r.phone,
			type: "mosquitofish" as const,
		})),
		...waterManagement.map((r) => ({
			createdAt: r.created_at,
			email: r.email,
			fullName: r.full_name,
			id: r.id,
			isProcessed: r.is_processed,
			phone: r.phone,
			type: "water-management" as const,
		})),
	];

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center gap-2">
				<Button
					onClick={() =>
						navigate({ to: "/service-requests/adult-mosquito/create" })
					}
					variant="default"
				>
					<Plus />
					Adult Mosquito
				</Button>
				<Button
					onClick={() =>
						navigate({ to: "/service-requests/mosquitofish/create" })
					}
					variant="default"
				>
					<Plus />
					Mosquitofish
				</Button>
				<Button
					onClick={() =>
						navigate({ to: "/service-requests/water-management/create" })
					}
					variant="default"
				>
					<Plus />
					Water Management
				</Button>
			</div>
			<ServiceRequestsTable data={mappedData} />
		</div>
	);
}
