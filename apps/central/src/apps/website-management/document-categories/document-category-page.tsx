import { DangerZoneCard } from "@mcmec/ui/blocks/danger-zone-card";
import { RecordDetail } from "@mcmec/ui/blocks/record-detail";
import { Button } from "@mcmec/ui/components/button";
import { toastOnError } from "@mcmec/ui/lib/toast-on-error";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Edit } from "lucide-react";
import { intents } from "@/src/lib/intents";

const route = getRouteApi(
	"/(app)/website-management/document-categories/$categoryId",
);

export function DocumentCategoryPage() {
	const { documents, documentTypes } = route.useRouteContext();
	const { category: loadedCategory } = route.useLoaderData();
	const { categoryId } = route.useParams();
	const navigate = useNavigate();

	// Read live rather than from the loader's one-shot read, which can land on the shape
	// snapshot before the change log applies — see @mcmec/ui/hooks/use-form-seed.
	const { data: liveCategories } = useLiveQuery(
		(q) =>
			q
				.from({ document_type: documentTypes })
				.where(({ document_type }) => eq(document_type.id, categoryId)),
		[documentTypes, categoryId],
	);
	const category = liveCategories[0] ?? loadedCategory;

	// The count is the whole reason this page has a danger zone rather than a row button: it is
	// what decides whether Delete is offered at all, and the person about to click needs to see
	// it. The server refuses the raced case with a 409 naming the blocker.
	const { data: heldDocuments } = useLiveQuery(
		(q) =>
			q
				.from({ document: documents })
				.where(({ document }) => eq(document.document_type_id, categoryId)),
		[documents, categoryId],
	);
	const documentCount = heldDocuments.length;

	const handleDelete = () => {
		const tx = documentTypes.delete(
			categoryId,
			intents("website.deleteDocumentCategory"),
		);
		toastOnError(tx, "Failed to delete category.");
		navigate({ to: "/website-management/document-categories" });
	};

	return (
		<RecordDetail
			actions={
				<Button asChild size="sm" variant="outline">
					<Link
						params={{ categoryId }}
						to="/website-management/document-categories/$categoryId/edit"
					>
						<Edit />
						Edit
					</Link>
				</Button>
			}
			backLink={
				<Button asChild size="sm" variant="outline">
					<Link search={true} to="/website-management/document-categories">
						<ArrowLeft />
						Back to Document Categories
					</Link>
				</Button>
			}
			danger={
				<DangerZoneCard
					disabled={documentCount > 0}
					label="Delete Category"
					onConfirm={handleDelete}
					recordName={category.name}
				/>
			}
			fields={[{ label: "Documents", value: documentCount }]}
			subtitle={category.description ?? "No description."}
			title={category.name}
		>
			{/* The reason Delete is unavailable is stated here, in the page's own text, rather
			    than in a tooltip on the disabled button or in the dialog behind it. A disabled
			    button takes no focus, so anything hung off it is unreachable by keyboard and
			    invisible to a screen reader — which is how the previous screen explained this
			    rule, and it explained it to nobody. */}
			<p className="text-foreground">
				{documentCount === 0
					? "No Documents are filed under this category, so it can be deleted."
					: `${documentCount} ${documentCount === 1 ? "Document is" : "Documents are"} filed under this category, so it cannot be deleted. Move them to another category first.`}
			</p>
		</RecordDetail>
	);
}
