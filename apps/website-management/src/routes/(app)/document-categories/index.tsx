import {
	RecordIndex,
	type RecordIndexColumn,
	validateRecordIndexSearch,
} from "@mcmec/ui/blocks/record-index";
import { Button } from "@mcmec/ui/components/button";
import { count, eq, useLiveQuery } from "@tanstack/react-db";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Edit, Plus, Tags } from "lucide-react";
import { documents, documentTypes } from "@/src/lib/db";

type CategoryRow = {
	id: string;
	name: string;
	description: string | null;
	documents: number;
};

export const Route = createFileRoute("/(app)/document-categories/")({
	component: RouteComponent,
	validateSearch: validateRecordIndexSearch,
});

function RouteComponent() {
	const navigate = Route.useNavigate();
	const search = Route.useSearch();

	const { data, collection } = useLiveQuery((q) =>
		q
			.from({ document_type: documentTypes })
			.leftJoin({ document: documents }, ({ document_type, document }) =>
				eq(document_type.id, document.document_type_id),
			)
			.groupBy(({ document_type }) => [
				document_type.id,
				document_type.name,
				document_type.description,
			])
			.select(({ document_type, document }) => ({
				description: document_type.description,
				id: document_type.id,
				name: document_type.name,
				documents: count(document?.id),
			})),
	);

	const rows: CategoryRow[] = data ?? [];

	const columns: RecordIndexColumn<CategoryRow>[] = [
		{
			cell: (row) => row.name,
			header: "Name",
			id: "name",
			identity: true,
			sortValue: (row) => row.name,
		},
		{
			cell: (row) => (
				<span className="text-muted-foreground">{row.description ?? "—"}</span>
			),
			cellClassName: "max-w-[48ch] truncate",
			header: "Description",
			id: "description",
			sortValue: (row) => row.description ?? "",
		},
		{
			align: "end",
			cell: (row) => row.documents,
			header: "Documents",
			id: "documents",
			sortValue: (row) => row.documents,
		},
	];

	return (
		<RecordIndex
			actions={
				<Button onClick={() => navigate({ to: "/document-categories/create" })}>
					<Plus />
					Create Document Category
				</Button>
			}
			columns={columns}
			defaultSort={{ dir: "asc", id: "name" }}
			description="The types a Document can be filed under, and how many Documents each one holds."
			emptyState={{
				description:
					"A Document has to be filed under a category, so this register is where a new kind of document starts.",
				icon: Tags,
				title: "No document categories",
			}}
			getRowKey={(row) => row.id}
			getRowLabel={(row) => row.name}
			getSearchText={(row) => `${row.name} ${row.description ?? ``}`}
			onSearchChange={(next) =>
				navigate({ search: { ...search, ...next }, to: "/document-categories" })
			}
			renderRowLink={({ row, className, children }) => (
				<Link
					className={className}
					params={{ categoryId: row.id }}
					search={search}
					to="/document-categories/$categoryId"
				>
					{children}
				</Link>
			)}
			// Edit only. `deleteDocumentCategory` is not offered here — ADR 0001 keeps delete in the
			// danger zone on the detail page, where the count of what it would take with it is
			// already on screen.
			rowActions={(row) => [
				{
					icon: <Edit />,
					label: "Edit",
					onAct: () =>
						navigate({
							params: { categoryId: row.id },
							to: "/document-categories/$categoryId/edit",
						}),
				},
			]}
			rows={rows}
			search={search}
			searchPlaceholder="Search categories"
			state={collection.isReady() ? "ready" : "loading"}
			title="Document Categories"
		/>
	);
}
