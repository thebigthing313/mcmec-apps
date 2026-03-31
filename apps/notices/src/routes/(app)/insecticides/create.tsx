import {
	InsecticidesRowSchema,
	type InsecticidesRowType,
} from "@mcmec/supabase/db/insecticides";
import { createFileRoute } from "@tanstack/react-router";
import { InsecticidesForm } from "@/src/components/insecticides-form";
import { insecticides } from "@/src/lib/db";
import { toastOnError } from "@/src/lib/toast-on-error";

export const Route = createFileRoute("/(app)/insecticides/create")({
	component: RouteComponent,
	loader: () => {
		return { crumb: "Create New Insecticide" };
	},
});

function RouteComponent() {
	const navigate = Route.useNavigate();
	const handleSubmit = async (value: InsecticidesRowType) => {
		const parsedItems = InsecticidesRowSchema.parse(value);
		const tx = insecticides.insert(parsedItems);
		toastOnError(tx, "Failed to create insecticide.");
		navigate({ to: "/insecticides" });
	};

	const defaultValues: InsecticidesRowType = {
		active_ingredient: "",
		active_ingredient_url: "",
		created_at: new Date(),
		created_by: null,
		id: crypto.randomUUID(),
		label_url: "",
		msds_url: "",
		trade_name: "",
		type_name: "",
		updated_at: new Date(),
		updated_by: null,
	};

	return (
		<InsecticidesForm
			defaultValues={defaultValues}
			formLabel="Create New Insecticide"
			onSubmit={handleSubmit}
			submitLabel="Create"
		/>
	);
}
