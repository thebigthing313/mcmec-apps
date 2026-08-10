import { Button } from "@mcmec/ui/components/button";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { DocumentsTable } from "@/src/components/documents-table";
import { useDocuments } from "@/src/hooks/use-documents";

export const Route = createFileRoute("/(app)/documents/")({
	component: RouteComponent,
	loader: () => {
		return { crumb: "Documents" };
	},
});

function RouteComponent() {
	const navigate = useNavigate();
	const { data: documents } = useDocuments();
	const mappedData = documents?.map((doc) => ({
		creator: doc.createdByName,
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
			<DocumentsTable data={mappedData ?? []} />
		</div>
	);
}
