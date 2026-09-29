import { PageHeader } from "@mcmec/ui/blocks/page-header";
import { toastOnError } from "@mcmec/ui/lib/toast-on-error";
import { useLiveQuery } from "@tanstack/react-db";
import { getRouteApi } from "@tanstack/react-router";
import {
	DocumentForm,
	type DocumentFormValues,
} from "@/src/apps/website-management/components/document-form";
import { intents } from "@/src/lib/intents";

const route = getRouteApi("/(app)/website-management/documents/create");

export function CreateDocumentPage() {
	const { documents, documentTypes } = route.useRouteContext();
	const navigate = route.useNavigate();
	const { data: categories } = useLiveQuery(
		(q) =>
			q
				.from({ document_type: documentTypes })
				.orderBy(({ document_type }) => document_type.name)
				.select(({ document_type }) => ({
					id: document_type.id,
					name: document_type.name,
				})),
		[documentTypes],
	);

	const items = categories.map((category) => ({
		label: category.name,
		value: category.id,
	}));

	const handleSubmit = async (value: DocumentFormValues) => {
		const now = new Date();
		// The id we mint here is the id the row will have: the envelope carries it and the
		// handler honours it, so the optimistic row and the committed row share a key — which
		// is also what lets this navigate straight to the detail route.
		const id = crypto.randomUUID();
		const tx = documents.insert(
			{
				...value,
				created_at: now,
				id,
				updated_at: now,
			},
			intents("website.createDocument"),
		);
		toastOnError(tx, "Failed to create document.");
		navigate({
			params: { documentId: id },
			to: "/website-management/documents/$documentId",
		});
	};

	return (
		<div>
			<PageHeader title="Create Document" />
			<DocumentForm
				categories={items}
				defaultValues={{
					document_type_id: "",
					fiscal_year: new Date().getFullYear(),
					url: "",
				}}
				mode="create"
				onSubmit={handleSubmit}
				submitLabel="Create as Draft"
			/>
		</div>
	);
}
