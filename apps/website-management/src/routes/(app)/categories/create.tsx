import { toastOnError } from "@mcmec/ui/lib/toast-on-error";
import { createFileRoute } from "@tanstack/react-router";
import {
	CategoryForm,
	type CategoryFormValues,
} from "@/src/components/category-form";
import { intents, noticeTypes } from "@/src/lib/db";

export const Route = createFileRoute("/(app)/categories/create")({
	component: RouteComponent,
	loader: () => {
		return { crumb: "Create" };
	},
});

function RouteComponent() {
	const navigate = Route.useNavigate();

	const handleSubmit = (value: CategoryFormValues) => {
		const now = new Date();
		const tx = noticeTypes.insert(
			{
				created_at: now,
				description: value.description.trim() || null,
				// The id minted here is the id the row will have — the envelope carries it and
				// the handler honours it, so the optimistic row and the committed row share a key.
				id: crypto.randomUUID(),
				name: value.name,
				updated_at: now,
			},
			intents("website.createNoticeCategory"),
		);
		toastOnError(tx, "Failed to create category.");
		navigate({ to: "/categories" });
	};

	return (
		<CategoryForm
			classifies="a Notice"
			defaultValues={{ description: "", name: "" }}
			formLabel="Create Notice Category"
			onSubmit={handleSubmit}
			submitLabel="Create"
		/>
	);
}
