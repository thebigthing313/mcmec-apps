import type { DocumentsRowType } from "@mcmec/supabase/db/documents";
import { useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import { DocumentForm } from "@/src/components/document-form";
import { documents, documentTypes } from "@/src/lib/db";
import { toastOnError } from "@/src/lib/toast-on-error";

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

	const handleSubmit = async (value: DocumentsRowType) => {
		const tx = documents.insert(value);
		toastOnError(tx, "Failed to create document.");
		navigate({ to: "/documents" });
	};

	return (
		<DocumentForm
			categories={items}
			defaultValues={{
				created_at: new Date(),
				created_by: null,
				document_type_id: "",
				fiscal_year: new Date().getFullYear(),
				id: crypto.randomUUID(),
				is_published: false,
				updated_at: new Date(),
				updated_by: null,
				url: "",
			}}
			formLabel="Create New Document"
			onSubmit={handleSubmit}
			submitLabel="Create"
		/>
	);
}
