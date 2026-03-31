import type { MosquitofishRequestsRowType } from "@mcmec/supabase/db/mosquitofish-requests";
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
import { Button } from "@mcmec/ui/components/button";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import { MosquitofishForm } from "@/src/components/mosquitofish-form";
import { toastOnError } from "@/src/lib/toast-on-error";

export const Route = createFileRoute(
	"/(app)/service-requests/mosquitofish/$requestId_/edit",
)({
	component: RouteComponent,
	loader: () => {
		return { crumb: "Edit" };
	},
});

function RouteComponent() {
	const navigate = Route.useNavigate();
	const { db } = Route.useRouteContext();
	const { requestId } = Route.useParams();

	const { data: request } = useLiveQuery(
		(q) =>
			q
				.from({ r: db.mosquitofishRequests })
				.where(({ r }) => eq(r.id, requestId))
				.findOne(),
		[requestId],
	);

	const { data: zipCodesList } = useLiveQuery((q) =>
		q.from({ zc: db.zipCodes }).orderBy(({ zc }) => zc.code),
	);

	const zipCodeOptions = zipCodesList.map((zc) => ({
		label: `${zc.code} — ${zc.city}, ${zc.state}`,
		value: zc.id,
	}));

	if (!request) {
		return null;
	}

	const handleSubmit = async (value: MosquitofishRequestsRowType) => {
		const tx = db.mosquitofishRequests.update(requestId, (draft) => {
			Object.assign(draft, value);
		});
		toastOnError(tx, "Failed to update request.");
		navigate({ to: "/service-requests" });
	};

	const handleDelete = async () => {
		const tx = db.mosquitofishRequests.delete(requestId);
		toastOnError(tx, "Failed to delete request.");
		navigate({ to: "/service-requests" });
	};

	const handleToggleProcessed = async () => {
		const tx = db.mosquitofishRequests.update(requestId, (draft) => {
			draft.is_processed = !draft.is_processed;
		});
		toastOnError(tx, "Failed to update request status.");
	};

	return (
		<div className="space-y-4">
			<div className="max-w-2xl">
				<Button
					className="w-full"
					onClick={handleToggleProcessed}
					variant={request.is_processed ? "outline" : "default"}
				>
					{request.is_processed ? "Mark as Unprocessed" : "Mark as Processed"}
				</Button>
			</div>

			<MosquitofishForm
				defaultValues={{
					additional_details: request.additional_details,
					address_line_1: request.address_line_1,
					address_line_2: request.address_line_2,
					created_at: new Date(request.created_at),
					created_by: request.created_by,
					email: request.email,
					full_name: request.full_name,
					id: request.id,
					is_processed: request.is_processed,
					location_of_water_body: request.location_of_water_body,
					phone: request.phone,
					type_of_water_body: request.type_of_water_body,
					updated_at: new Date(),
					updated_by: null,
					zip_code_id: request.zip_code_id,
				}}
				formLabel="Edit Mosquitofish Request"
				onSubmit={handleSubmit}
				submitLabel="Update"
				zipCodes={zipCodeOptions}
			/>

			<div className="max-w-2xl">
				<AlertDialog>
					<AlertDialogTrigger asChild>
						<Button className="w-full" variant="destructive">
							Delete Request
						</Button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
							<AlertDialogDescription>
								This action cannot be undone. This will permanently delete the
								request from {request.full_name}.
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
			</div>
		</div>
	);
}
