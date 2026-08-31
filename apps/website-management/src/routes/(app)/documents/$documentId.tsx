import { DangerZoneCard } from "@mcmec/ui/blocks/danger-zone-card";
import { LifecycleButton } from "@mcmec/ui/blocks/lifecycle-button";
import { RecordDetail } from "@mcmec/ui/blocks/record-detail";
import { Badge } from "@mcmec/ui/components/badge";
import { Button } from "@mcmec/ui/components/button";
import { toastOnError } from "@mcmec/ui/lib/toast-on-error";
import { eq, useLiveQuery } from "@tanstack/react-db";
import {
	createFileRoute,
	Link,
	notFound,
	useNavigate,
} from "@tanstack/react-router";
import { ArrowLeft, Edit, ExternalLink, Undo2, Upload } from "lucide-react";
import { documents, documentTypes, intents } from "@/src/lib/db";
import { runLifecycle } from "@/src/lib/lifecycle";

export const Route = createFileRoute("/(app)/documents/$documentId")({
	component: RouteComponent,
	loader: async ({ params }) => {
		await Promise.all([documents.preload(), documentTypes.preload()]);
		const document = documents.get(params.documentId);
		if (!document) {
			throw notFound();
		}
		const typeName =
			documentTypes.get(document.document_type_id)?.name ?? "Document";
		return {
			crumb: `${document.fiscal_year} ${typeName}`,
			document,
		};
	},
});

function RouteComponent() {
	const { document: loadedDocument } = Route.useLoaderData();
	const { documentId } = Route.useParams();
	const navigate = useNavigate();

	// Read live rather than from the loader's one-shot read, which can land on the shape
	// snapshot before the change log applies — see @mcmec/ui/hooks/use-form-seed.
	const { data: liveDocuments } = useLiveQuery(
		(q) =>
			q
				.from({ document: documents })
				.where(({ document }) => eq(document.id, documentId)),
		[documentId],
	);
	const document = liveDocuments[0] ?? loadedDocument;
	const { id, document_type_id, fiscal_year, url, is_published } = document;
	const type = documentTypes.get(document_type_id)?.name;

	// No form under this, so no `isDirty` and no relabel: a detail-view lifecycle button always
	// sends exactly one intent. The page stays put afterwards — the badge below is live, so the
	// result of the click is visible where the click was. (It used to navigate away, which is
	// how a publish confirmed itself before this page could show the answer.)
	const publish = is_published
		? {
				icon: <Undo2 />,
				label: "Unpublish",
				onAct: () =>
					runLifecycle(documents, id, {
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
					runLifecycle(documents, id, {
						apply: (draft) => {
							draft.is_published = true;
						},
						command: "website.publishDocument",
						failure: "Failed to publish document.",
					}),
			};

	// Delete is the one action whose placement is not free — detail page only, danger zone,
	// behind a confirm (ADR 0001). It leaves the page because the record it was showing is gone.
	const handleDelete = () => {
		const tx = documents.delete(id, intents("website.deleteDocument"));
		toastOnError(tx, "Failed to delete document.");
		navigate({ to: "/documents" });
	};

	return (
		<RecordDetail
			actions={
				<>
					<Button asChild size="sm" variant="outline">
						<Link params={{ documentId: id }} to="/documents/$documentId/edit">
							<Edit />
							Edit
						</Link>
					</Button>
					<LifecycleButton
						icon={publish.icon}
						label={publish.label}
						onAct={publish.onAct}
						size="sm"
					/>
				</>
			}
			backLink={
				<Button asChild size="sm" variant="outline">
					<Link search={true} to="/documents">
						<ArrowLeft />
						Back to Documents
					</Link>
				</Button>
			}
			badge={
				is_published ? (
					<Badge variant="default">Published</Badge>
				) : (
					<Badge variant="outline">Draft</Badge>
				)
			}
			danger={
				<DangerZoneCard
					label="Delete Document"
					onConfirm={handleDelete}
					recordName={`${fiscal_year} ${type ?? "Document"}`}
				/>
			}
			// No `fields`: the title is already `${fiscal_year} ${type}`, so listing Category and
			// Fiscal year beneath it restated the heading twice — the same "Closed: Yes beside a
			// badge reading Closed" pattern this pass removed from Job Postings. A Document's
			// content is the link, and that is what the body carries.
			title={`${fiscal_year} ${type}`}
		>
			<a
				className="inline-flex items-center gap-1 text-primary text-sm hover:underline"
				href={url}
				rel="noopener noreferrer"
				target="_blank"
			>
				<ExternalLink className="h-4 w-4" />
				Open document
			</a>
		</RecordDetail>
	);
}
