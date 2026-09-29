import { PageHeader } from "@mcmec/ui/blocks/page-header";
import { rowVersion, useFormSeed } from "@mcmec/ui/hooks/use-form-seed";
import { toastOnError } from "@mcmec/ui/lib/toast-on-error";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { getRouteApi } from "@tanstack/react-router";
import {
	CategoryForm,
	type CategoryFormValues,
} from "@/src/apps/website-management/components/category-form";
import { intents } from "@/src/lib/intents";

const route = getRouteApi(
	"/(app)/website-management/document-categories/$categoryId_/edit",
);

export function EditDocumentCategoryPage() {
	const { documentTypes } = route.useRouteContext();
	const navigate = route.useNavigate();
	const { category: loadedCategory } = route.useLoaderData();
	const { categoryId } = route.useParams();

	// Seed from the live row, not the loader's one-shot read — see @mcmec/ui/hooks/use-form-seed.
	const { data: liveCategories } = useLiveQuery(
		(q) =>
			q
				.from({ document_type: documentTypes })
				.where(({ document_type }) => eq(document_type.id, categoryId)),
		[documentTypes, categoryId],
	);
	const category = liveCategories[0] ?? loadedCategory;
	const { seedKey, latchProps } = useFormSeed(rowVersion(category));

	const handleSubmit = (value: CategoryFormValues) => {
		const tx = documentTypes.update(
			categoryId,
			intents("website.updateDocumentCategoryDetails"),
			(draft) => {
				draft.name = value.name;
				draft.description = value.description.trim() || null;
			},
		);
		toastOnError(tx, "Failed to update category.");
		navigate({
			params: { categoryId },
			to: "/website-management/document-categories/$categoryId",
		});
	};

	return (
		<div {...latchProps}>
			<PageHeader title="Edit Document Category" />
			<CategoryForm
				classifies="a Document"
				defaultValues={{
					description: category.description ?? "",
					name: category.name,
				}}
				key={seedKey}
				onSubmit={handleSubmit}
				submitLabel="Update"
			/>
		</div>
	);
}
