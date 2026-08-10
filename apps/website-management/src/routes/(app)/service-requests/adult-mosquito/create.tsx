import type { AdultMosquitoRequestsBaseSchema } from "@mcmec/supabase/db/adult-mosquito-requests";
import { useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import type z from "zod";
import { AdultMosquitoForm } from "@/src/components/adult-mosquito-form";
import { toastOnError } from "@/src/lib/toast-on-error";

type AdultMosquitoRequestsBaseType = z.infer<
	typeof AdultMosquitoRequestsBaseSchema
>;

export const Route = createFileRoute(
	"/(app)/service-requests/adult-mosquito/create",
)({
	component: RouteComponent,
	loader: () => {
		return { crumb: "Create Adult Mosquito Complaint" };
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

	const handleSubmit = async (value: AdultMosquitoRequestsBaseType) => {
		const tx = db.adultMosquitoRequests.insert(value);
		toastOnError(tx, "Failed to create request.");
		navigate({ to: "/service-requests" });
	};

	return (
		<AdultMosquitoForm
			defaultValues={{
				additional_details: null,
				address_line_1: "",
				address_line_2: null,
				created_at: new Date(),
				created_by: null,
				email: null,
				full_name: "",
				id: crypto.randomUUID(),
				is_accessible: true,
				is_daytime: false,
				is_dusk_dawn: false,
				is_front_of_property: false,
				is_general_vicinity: false,
				is_nighttime: false,
				is_processed: false,
				is_rear_of_property: false,
				phone: "",
				updated_at: new Date(),
				updated_by: null,
				zip_code_id: "",
			}}
			formLabel="Create Adult Mosquito Complaint"
			onSubmit={handleSubmit}
			submitLabel="Create"
			zipCodes={zipCodeOptions}
		/>
	);
}
