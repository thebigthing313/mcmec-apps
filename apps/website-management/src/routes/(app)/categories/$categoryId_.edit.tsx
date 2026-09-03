import { PageHeader } from "@mcmec/ui/blocks/page-header";
import { rowVersion, useFormSeed } from "@mcmec/ui/hooks/use-form-seed";
import { toastOnError } from "@mcmec/ui/lib/toast-on-error";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { createFileRoute, notFound } from "@tanstack/react-router";
import {
	CategoryForm,
	type CategoryFormValues,
} from "@/src/components/category-form";
import { intents, noticeTypes } from "@/src/lib/db";

export const Route = createFileRoute("/(app)/categories/$categoryId_/edit")({
	component: RouteComponent,
	loader: async ({ params }) => {
		await noticeTypes.preload();
		const category = noticeTypes.get(params.categoryId);
		if (!category) {
			throw notFound();
		}
		return { category, crumb: "Edit" };
	},
});

function RouteComponent() {
	const navigate = Route.useNavigate();
	const { category: loadedCategory } = Route.useLoaderData();
	const { categoryId } = Route.useParams();

	// Seed from the live row, not the loader's one-shot read — see @mcmec/ui/hooks/use-form-seed.
	const { data: liveCategories } = useLiveQuery(
		(q) =>
			q
				.from({ notice_type: noticeTypes })
				.where(({ notice_type }) => eq(notice_type.id, categoryId)),
		[categoryId],
	);
	const category = liveCategories[0] ?? loadedCategory;
	const { seedKey, latchProps } = useFormSeed(rowVersion(category));

	const handleSubmit = (value: CategoryFormValues) => {
		const tx = noticeTypes.update(
			categoryId,
			intents("website.updateNoticeCategoryDetails"),
			(draft) => {
				draft.name = value.name;
				draft.description = value.description.trim() || null;
			},
		);
		toastOnError(tx, "Failed to update category.");
		navigate({ params: { categoryId }, to: "/categories/$categoryId" });
	};

	return (
		<div {...latchProps}>
			<PageHeader title="Edit Notice Category" />
			<CategoryForm
				classifies="a Notice"
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
