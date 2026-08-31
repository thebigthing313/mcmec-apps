import {
	InsecticidesRowSchema,
	type InsecticidesRowType,
} from "@mcmec/schemas/db/insecticides";
import { toastOnError } from "@mcmec/ui/lib/toast-on-error";
import { createFileRoute } from "@tanstack/react-router";
import { InsecticidesForm } from "@/src/components/insecticides-form";
import { insecticides, intents } from "@/src/lib/db";

export const Route = createFileRoute("/(app)/insecticides/create")({
	component: RouteComponent,
	loader: () => {
		return { crumb: "Create" };
	},
});

function RouteComponent() {
	const navigate = Route.useNavigate();
	const handleSubmit = async (value: InsecticidesRowType) => {
		const parsedItems = InsecticidesRowSchema.parse(value);
		const tx = insecticides.insert(
			parsedItems,
			intents("website.createInsecticide"),
		);
		toastOnError(tx, "Failed to create insecticide.");
		// The row carries the id the form was seeded with, and the handler honours it — so the
		// optimistic row and the committed row share a key, and this can land on the record.
		navigate({
			params: { insecticideId: parsedItems.id },
			to: "/insecticides/$insecticideId",
		});
	};

	const defaultValues: InsecticidesRowType = {
		active_ingredient: "",
		active_ingredient_url: "",
		created_at: new Date(),
		id: crypto.randomUUID(),
		label_url: "",
		msds_url: "",
		trade_name: "",
		type_name: "",
		updated_at: new Date(),
	};

	return (
		<InsecticidesForm
			defaultValues={defaultValues}
			formLabel="Create Insecticide"
			onSubmit={handleSubmit}
			submitLabel="Create"
		/>
	);
}
