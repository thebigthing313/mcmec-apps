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
		return { crumb: "Create New Document" };
	},
});

function RouteComponent() {
	const navigate = Route.useNavigate();
	const { data: categories } = useLiveQuery((q) =>
		q.from({ document_type: documentTypes }).select(({ document_type }) => ({
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
		const tx = documents.insert(
			{
				...value,
				created_at: now,
				// The id we mint here is the id the row will have: the envelope carries it and
				// the handler honours it. Under the old path it was thrown away server-side, so
				// the optimistic row and the committed row had different keys on every insert.
				id: crypto.randomUUID(),
				updated_at: now,
			},
			intents("website.createDocument"),
		);
		toastOnError(tx, "Failed to create document.");
		navigate({ to: "/documents" });
	};

	return (
		<DocumentForm
			categories={items}
			defaultValues={{
				document_type_id: "",
				fiscal_year: new Date().getFullYear(),
				url: "",
			}}
			formLabel="Create New Document"
			mode="create"
			onSubmit={handleSubmit}
			submitLabel="Create"
		/>
	);
}
