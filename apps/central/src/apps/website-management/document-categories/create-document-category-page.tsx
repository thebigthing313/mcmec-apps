import { PageHeader } from "@mcmec/ui/blocks/page-header";
import { toastOnError } from "@mcmec/ui/lib/toast-on-error";
import { getRouteApi } from "@tanstack/react-router";
import {
	CategoryForm,
	type CategoryFormValues,
} from "@/src/apps/website-management/components/category-form";
import { intents } from "@/src/lib/intents";

const route = getRouteApi(
	"/(app)/website-management/document-categories/create",
);

export function CreateDocumentCategoryPage() {
	const { documentTypes } = route.useRouteContext();
	const navigate = route.useNavigate();

	const handleSubmit = (value: CategoryFormValues) => {
		const now = new Date();
		const id = crypto.randomUUID();
		const tx = documentTypes.insert(
			{
				created_at: now,
				description: value.description.trim() || null,
				// The id minted here is the id the row will have — the envelope carries it and
				// the handler honours it, so the optimistic row and the committed row share a key.
				id,
				name: value.name,
				updated_at: now,
			},
			intents("website.createDocumentCategory"),
		);
		toastOnError(tx, "Failed to create category.");
		navigate({
			params: { categoryId: id },
			to: "/website-management/document-categories/$categoryId",
		});
	};

	return (
		<div>
			<PageHeader title="Create Document Category" />
			<CategoryForm
				classifies="a Document"
				defaultValues={{ description: "", name: "" }}
				onSubmit={handleSubmit}
				submitLabel="Create"
			/>
		</div>
	);
}
