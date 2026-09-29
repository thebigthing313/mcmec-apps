import type { CommandName } from "@mcmec/domain";
import { LifecycleButton } from "@mcmec/ui/blocks/lifecycle-button";
import { PageHeader } from "@mcmec/ui/blocks/page-header";
import { rowVersion, useFormSeed } from "@mcmec/ui/hooks/use-form-seed";
import { toastOnError } from "@mcmec/ui/lib/toast-on-error";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { getRouteApi } from "@tanstack/react-router";
import { Undo2, Upload } from "lucide-react";
import {
	type DocumentDetailValues,
	DocumentForm,
	type DocumentFormValues,
} from "@/src/apps/website-management/components/document-form";
import {
	changedFields,
	type Draft,
	runLifecycle,
} from "@/src/apps/website-management/lib/lifecycle";
import type { CentralCollection } from "@/src/lib/collections";
import { intents } from "@/src/lib/intents";

const route = getRouteApi(
	"/(app)/website-management/documents/$documentId_/edit",
);

type DocumentDraft = Draft<CentralCollection<"documents">>;

/** Exactly the fields `website.updateDocumentDetails` accepts — the Save half of a Save-and-X. */
function detailValues(value: DocumentDetailValues) {
	return {
		document_type_id: value.document_type_id,
		fiscal_year: value.fiscal_year,
		url: value.url,
	};
}

export function EditDocumentPage() {
	const { documents, documentTypes } = route.useRouteContext();
	const navigate = route.useNavigate();
	const { document: loadedDocument } = route.useLoaderData();
	const { documentId } = route.useParams();

	// Seed from the live row, not the loader's one-shot read — see @mcmec/ui/hooks/use-form-seed.
	const { data: liveDocuments } = useLiveQuery(
		(q) =>
			q
				.from({ document: documents })
				.where(({ document }) => eq(document.id, documentId)),
		[documents, documentId],
	);
	const document = liveDocuments[0] ?? loadedDocument;
	const { seedKey, latchProps } = useFormSeed(rowVersion(document));

	const { data: categories } = useLiveQuery(
		(q) =>
			q
				.from({ document_type: documentTypes })
				.orderBy(({ document_type }) => document_type.name),
		[documentTypes],
	);

	const items = categories.map((category) => ({
		label: category.name,
		value: category.id,
	}));

	const handleSubmit = async (value: DocumentFormValues) => {
		const tx = documents.update(
			documentId,
			intents("website.updateDocumentDetails"),
			(draft) => {
				Object.assign(draft, detailValues(value));
			},
		);
		toastOnError(tx, "Failed to update document.");
		navigate({
			params: { documentId },
			to: "/website-management/documents/$documentId",
		});
	};

	return (
		<div className="space-y-4" {...latchProps}>
			<PageHeader title="Edit Document" />
			<DocumentForm
				actions={({ values }) => {
					// Diffed against the LIVE row, so the label and the payload cannot disagree: if
					// this is empty the button stays "Publish" and sends one intent, and
					// `updateDocumentDetails` is never handed a payload its own non-empty
					// refinement would refuse.
					const changes = changedFields(detailValues(values), document);
					const isDirty = Object.keys(changes).length > 0;

					// One request, both intents, one transaction — so the two either land together
					// or roll back together.
					const act =
						(
							command: CommandName,
							apply: (draft: DocumentDraft) => void,
							failure: string,
						) =>
						(withSave: boolean) =>
							runLifecycle(documents, documentId, {
								apply,
								command,
								failure,
								save: withSave
									? { changes, command: "website.updateDocumentDetails" }
									: undefined,
							});

					const publish = document.is_published
						? {
								icon: <Undo2 />,
								label: "Unpublish",
								onAct: act(
									"website.unpublishDocument",
									(draft) => {
										draft.is_published = false;
									},
									"Failed to unpublish document.",
								),
							}
						: {
								icon: <Upload />,
								label: "Publish",
								onAct: act(
									"website.publishDocument",
									(draft) => {
										draft.is_published = true;
									},
									"Failed to publish document.",
								),
							};

					return (
						<LifecycleButton
							className="w-full"
							icon={publish.icon}
							isDirty={isDirty}
							label={publish.label}
							onAct={publish.onAct}
						/>
					);
				}}
				categories={items}
				defaultValues={{
					document_type_id: document.document_type_id,
					fiscal_year: document.fiscal_year,
					url: document.url,
				}}
				key={seedKey}
				mode="edit"
				onSubmit={handleSubmit}
				submitLabel="Update"
			/>
		</div>
	);
}
