import { ErrorMessages } from "@mcmec/lib/constants/errors";
import type { DocumentsRowType } from "@mcmec/supabase/db/documents";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@mcmec/ui/components/alert-dialog";
import { Button } from "@mcmec/ui/components/button";
import { useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import { DocumentForm } from "@/src/components/document-form";
import { documents, documentTypes } from "@/src/lib/db";
import { toastOnError } from "@/src/lib/toast-on-error";

export const Route = createFileRoute("/(app)/documents/$documentId_/edit")({
	component: RouteComponent,
	loader: async ({ params }) => {
		await Promise.all([documents.preload(), documentTypes.preload()]);
		const document = documents.get(params.documentId);
		if (!document) {
			throw new Error(ErrorMessages.DATABASE.RECORD_NOT_AVAILABLE);
		}
		return { crumb: "Edit", document };
	},
});

function RouteComponent() {
	const navigate = Route.useNavigate();
	const { document } = Route.useLoaderData();
	const { documentId } = Route.useParams();

	const { data: categories } = useLiveQuery((q) =>
		q
			.from({ document_type: documentTypes })
			.orderBy(({ document_type }) => document_type.name),
	);

	const items = categories.map((category) => ({
		label: category.name,
		value: category.id,
	}));

	const handleSubmit = async (value: DocumentsRowType) => {
		const tx = documents.update(documentId, (draft) => {
			Object.assign(draft, value);
		});
		toastOnError(tx, "Failed to update document.");
		navigate({ to: "/documents" });
	};

	const handleDelete = async () => {
		const tx = documents.delete(documentId);
		toastOnError(tx, "Failed to delete document.");
		navigate({ to: "/documents" });
	};

	return (
		<div className="space-y-4">
			<DocumentForm
				categories={items}
				defaultValues={{
					created_at: new Date(document.created_at),
					created_by: document.created_by,
					document_type_id: document.document_type_id,
					fiscal_year: document.fiscal_year,
					id: document.id,
					is_published: document.is_published,
					updated_at: new Date(),
					updated_by: null,
					url: document.url,
				}}
				formLabel="Edit Document"
				onSubmit={handleSubmit}
				submitLabel="Update"
			/>

			<div className="max-w-2xl">
				<AlertDialog>
					<AlertDialogTrigger asChild>
						<Button className="w-full" variant="destructive">
							Delete Document
						</Button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
							<AlertDialogDescription>
								This action cannot be undone. This will permanently delete this
								document.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction onClick={handleDelete}>
								Delete
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>
		</div>
	);
}
