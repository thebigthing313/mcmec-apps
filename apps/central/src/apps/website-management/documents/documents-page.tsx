import {
	RecordIndex,
	type RecordIndexColumn,
} from "@mcmec/ui/blocks/record-index";
import { Badge } from "@mcmec/ui/components/badge";
import { Button } from "@mcmec/ui/components/button";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";
import { FileArchive, Plus, Undo2, Upload } from "lucide-react";
import { runLifecycle } from "@/src/apps/website-management/lib/lifecycle";

type DocumentRow = {
	id: string;
	documentType: string;
	fiscalYear: number;
	isPublished: boolean;
	url: string;
};

const route = getRouteApi("/(app)/website-management/documents/");

export function DocumentsPage() {
	const { documents, documentTypes } = route.useRouteContext();
	const navigate = useNavigate();
	const search = route.useSearch();
	const { data: documentList, collection } = useLiveQuery(
		(q) =>
			q
				.from({ document: documents })
				.innerJoin(
					{ document_type: documentTypes },
					({ document, document_type }) =>
						eq(document.document_type_id, document_type.id),
				)
				.select(({ document, document_type }) => ({
					documentType: document_type?.name,
					fiscalYear: document.fiscal_year,
					id: document.id,
					isPublished: document.is_published,
					url: document.url,
				})),
		[documents, documentTypes],
	);

	const rows: DocumentRow[] = (documentList ?? []).map((doc) => ({
		documentType: doc.documentType,
		fiscalYear: doc.fiscalYear,
		id: doc.id,
		isPublished: doc.isPublished,
		url: doc.url,
	}));

	const columns: RecordIndexColumn<DocumentRow>[] = [
		{
			// A Document has no title of its own — its identity is its category and fiscal year,
			// which is exactly how the public site lists it ("Annual Audit, FY2026").
			cell: (row) => row.documentType,
			header: "Document Type",
			id: "documentType",
			identity: true,
			sortValue: (row) => row.documentType,
		},
		{
			cell: (row) => <span className="tabular-nums">FY{row.fiscalYear}</span>,
			header: "Fiscal Year",
			id: "fiscalYear",
			sortValue: (row) => row.fiscalYear,
		},
		{
			cell: (row) => (
				<Badge variant={row.isPublished ? "default" : "outline"}>
					{row.isPublished ? "Published" : "Draft"}
				</Badge>
			),
			header: "Status",
			id: "isPublished",
			sortValue: (row) => (row.isPublished ? "Published" : "Draft"),
		},
		{
			cell: (row) => (
				<a
					className="text-primary text-sm hover:underline"
					href={row.url}
					rel="noopener noreferrer"
					target="_blank"
				>
					Open document
				</a>
			),
			header: "File",
			id: "url",
		},
	];

	return (
		<RecordIndex
			actions={
				<Button
					onClick={() =>
						navigate({ to: "/website-management/documents/create" })
					}
				>
					<Plus />
					Create Document
				</Button>
			}
			columns={columns}
			defaultSort={{ dir: "desc", id: "fiscalYear" }}
			description="Budgets, audits and other records published to the public website."
			emptyState={{
				description:
					"Published documents appear on the public website under their category and fiscal year.",
				icon: FileArchive,
				title: "No documents yet",
			}}
			getRowKey={(row) => row.id}
			getRowLabel={(row) => `${row.documentType}, FY${row.fiscalYear}`}
			getSearchText={(row) => `${row.documentType} ${row.fiscalYear}`}
			onSearchChange={(next) =>
				navigate({
					search: { ...search, ...next },
					to: "/website-management/documents",
				})
			}
			renderRowLink={({ row, className, children }) => (
				<Link
					className={className}
					params={{ documentId: row.id }}
					search={search}
					to="/website-management/documents/$documentId"
				>
					{children}
				</Link>
			)}
			// A shortcut, never the only way in: publishing is also on the detail view and in the
			// edit form (ADR 0001). Delete is not here and never can be — it lives in the danger
			// zone on the detail page.
			rowActions={(document) => [
				document.isPublished
					? {
							confirm: {
								actionLabel: "Unpublish",
								description: `${document.documentType} (FY${document.fiscalYear}) will be removed from the public website immediately. The file stays here and can be published again.`,
								title: "Remove this document from the public site?",
							},
							icon: <Undo2 />,
							label: "Unpublish",
							onAct: () =>
								runLifecycle(documents, document.id, {
									apply: (draft) => {
										draft.is_published = false;
									},
									command: "website.unpublishDocument",
									failure: "Failed to unpublish document.",
									success: `${document.documentType} (FY${document.fiscalYear}) is no longer on the public site.`,
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
									success: `${document.documentType} (FY${document.fiscalYear}) is now on the public site.`,
								}),
						},
			]}
			rows={rows}
			search={search}
			searchPlaceholder="Search documents"
			state={collection.isReady() ? "ready" : "loading"}
			title="Documents"
		/>
	);
}
