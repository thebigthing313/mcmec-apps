import { toastOnError } from "@mcmec/ui/lib/toast-on-error";
import { useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import {
	DocumentForm,
	type DocumentFormValues,
} from "@/src/components/document-form";
import { documents, documentTypes, intents } from "@/src/lib/db";

export const Route = createFileRoute("/(app)/documents/create")({
	component: RouteComponent,
	loader: () => {
		return { crumb: "Create" };
	},
});

function RouteComponent() {
	const navigate = Route.useNavigate();
	const { data: categories } = useLiveQuery((q) =>
		q
			.from({ document_type: documentTypes })
			.orderBy(({ document_type }) => document_type.name)
			.select(({ document_type }) => ({
				id: document_type.id,
				name: document_type.name,
			})),
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
		navigate({ params: { documentId: id }, to: "/documents/$documentId" });
	};

	return (
		<DocumentForm
			categories={items}
			defaultValues={{
				document_type_id: "",
				fiscal_year: new Date().getFullYear(),
				url: "",
			}}
			formLabel="Create Document"
			mode="create"
			onSubmit={handleSubmit}
			submitLabel="Create as Draft"
		/>
	);
}
