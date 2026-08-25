import { Button } from "@mcmec/ui/components/button";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, Undo2, Upload } from "lucide-react";
import { DocumentsTable } from "@/src/components/documents-table";
import { useDocuments } from "@/src/hooks/use-documents";
import { documents } from "@/src/lib/db";
import { runLifecycle } from "@/src/lib/lifecycle";

export const Route = createFileRoute("/(app)/documents/")({
	component: RouteComponent,
	loader: () => {
		return { crumb: "Documents" };
	},
});

function RouteComponent() {
	const navigate = useNavigate();
	const { data: documentList } = useDocuments();
	const mappedData = documentList?.map((doc) => ({
		documentType: doc.documentType,
		fiscalYear: doc.fiscalYear,
		id: doc.id,
		isPublished: doc.isPublished,
	}));

	return (
		<div className="flex flex-col gap-2">
			<Button
				onClick={() => navigate({ to: "/documents/create" })}
				variant="default"
			>
				<Plus />
				Create New Document
			</Button>
			<DocumentsTable
				data={mappedData ?? []}
				// A shortcut, never the only way in: publishing is also on the detail view and in
				// the edit form (ADR 0001). Delete is not here and never can be — it lives in the
				// danger zone on the detail page.
				rowActions={(document) => [
					document.isPublished
						? {
								icon: <Undo2 />,
								label: "Unpublish",
								onAct: () =>
									runLifecycle(documents, document.id, {
										apply: (draft) => {
											draft.is_published = false;
										},
										command: "website.unpublishDocument",
										failure: "Failed to unpublish document.",
									}),
							}
						: {
								icon: <Upload />,
								label: "Publish",
								onAct: () =>
									runLifecycle(documents, document.id, {
										apply: (draft) => {
											draft.is_published = true;
										},
										command: "website.publishDocument",
										failure: "Failed to publish document.",
									}),
							},
				]}
			/>
		</div>
	);
}
