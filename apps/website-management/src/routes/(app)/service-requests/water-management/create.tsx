import type { WaterManagementRequestsBaseSchema } from "@mcmec/supabase/db/water-management-requests";
import { useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import type z from "zod";
import { WaterManagementForm } from "@/src/components/water-management-form";
import { toastOnError } from "@/src/lib/toast-on-error";

type WaterManagementRequestsBaseType = z.infer<
	typeof WaterManagementRequestsBaseSchema
>;

export const Route = createFileRoute(
	"/(app)/service-requests/water-management/create",
)({
	component: RouteComponent,
	loader: () => {
		return { crumb: "Create Water Management Request" };
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

	const handleSubmit = async (value: WaterManagementRequestsBaseType) => {
		const tx = db.waterManagementRequests.insert(value);
		toastOnError(tx, "Failed to create request.");
		navigate({ to: "/service-requests" });
	};

	return (
		<WaterManagementForm
			defaultValues={{
				additional_details: null,
				address_line_1: "",
				address_line_2: null,
				created_at: new Date(),
				created_by: null,
				email: null,
				full_name: "",
				id: crypto.randomUUID(),
				is_on_my_property: false,
				is_on_neighbor_property: false,
				is_on_public_property: false,
				is_processed: false,
				other_location_description: null,
				phone: "",
				updated_at: new Date(),
				updated_by: null,
				zip_code_id: "",
			}}
			formLabel="Create Water Management Request"
			onSubmit={handleSubmit}
			submitLabel="Create"
			zipCodes={zipCodeOptions}
		/>
	);
}
