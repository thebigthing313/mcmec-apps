import {
	InsecticidesRowSchema,
	type InsecticidesRowType,
} from "@mcmec/schemas/db/insecticides";
import { PageHeader } from "@mcmec/ui/blocks/page-header";
import { toastOnError } from "@mcmec/ui/lib/toast-on-error";
import { getRouteApi } from "@tanstack/react-router";
import { InsecticidesForm } from "@/src/apps/website-management/components/insecticides-form";
import { intents } from "@/src/lib/intents";

const route = getRouteApi("/(app)/website-management/insecticides/create");

export function CreateInsecticidePage() {
	const { insecticides } = route.useRouteContext();
	const navigate = route.useNavigate();
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
			to: "/website-management/insecticides/$insecticideId",
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
		<div>
			<PageHeader title="Create Insecticide" />
			<InsecticidesForm
				defaultValues={defaultValues}
				onSubmit={handleSubmit}
				submitLabel="Create"
			/>
		</div>
	);
}
