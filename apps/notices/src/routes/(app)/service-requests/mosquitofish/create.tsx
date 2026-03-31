import type { MosquitofishRequestsRowType } from "@mcmec/supabase/db/mosquitofish-requests";
import { useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import { MosquitofishForm } from "@/src/components/mosquitofish-form";
import { toastOnError } from "@/src/lib/toast-on-error";

export const Route = createFileRoute(
	"/(app)/service-requests/mosquitofish/create",
)({
	component: RouteComponent,
	loader: () => {
		return { crumb: "Create Mosquitofish Request" };
	},
});

function RouteComponent() {
	const navigate = Route.useNavigate();
	const { db } = Route.useRouteContext();

	const { data: zipCodesList } = useLiveQuery((q) =>
		q.from({ zc: db.zipCodes }).orderBy(({ zc }) => zc.code),
	);

	const zipCodeOptions = zipCodesList.map((zc) => ({
		label: `${zc.code} — ${zc.city}, ${zc.state}`,
		value: zc.id,
	}));

	const handleSubmit = async (value: MosquitofishRequestsRowType) => {
		const tx = db.mosquitofishRequests.insert(value);
		toastOnError(tx, "Failed to create request.");
		navigate({ to: "/service-requests" });
	};

	return (
		<MosquitofishForm
			defaultValues={{
				additional_details: null,
				address_line_1: "",
				address_line_2: null,
				created_at: new Date(),
				created_by: null,
				email: null,
				full_name: "",
				id: crypto.randomUUID(),
				is_processed: false,
				location_of_water_body: "",
				phone: "",
				type_of_water_body: "",
				updated_at: new Date(),
				updated_by: null,
				zip_code_id: "",
			}}
			formLabel="Create Mosquitofish Request"
			onSubmit={handleSubmit}
			submitLabel="Create"
			zipCodes={zipCodeOptions}
		/>
	);
}
