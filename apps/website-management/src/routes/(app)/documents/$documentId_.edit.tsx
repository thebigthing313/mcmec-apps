import type { CommandName } from "@mcmec/domain";
import { ErrorMessages } from "@mcmec/lib/constants/errors";
import { LifecycleButton } from "@mcmec/ui/blocks/lifecycle-button";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import { Undo2, Upload } from "lucide-react";
import {
	DocumentForm,
	type DocumentFormValues,
} from "@/src/components/document-form";
import { documents, documentTypes, intents } from "@/src/lib/db";
import { changedFields, type Draft, runLifecycle } from "@/src/lib/lifecycle";
import { toastOnError } from "@/src/lib/toast-on-error";
import { rowVersion, useFormSeed } from "@/src/lib/use-form-seed";

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

type DocumentDraft = Draft<typeof documents>;

/** Exactly the fields `website.updateDocumentDetails` accepts — the Save half of a Save-and-X. */
function detailValues(value: DocumentFormValues) {
	return {
		document_type_id: value.document_type_id,
		fiscal_year: value.fiscal_year,
		url: value.url,
	};
}

function RouteComponent() {
	const navigate = Route.useNavigate();
	const { document: loadedDocument } = Route.useLoaderData();
	const { documentId } = Route.useParams();

	// Seed from the live row, not the loader's one-shot read — see use-form-seed.ts.
	const { data: liveDocuments } = useLiveQuery(
		(q) =>
			q
				.from({ document: documents })
				.where(({ document }) => eq(document.id, documentId)),
		[documentId],
	);
	const document = liveDocuments[0] ?? loadedDocument;
	const { seedKey, latchProps } = useFormSeed(rowVersion(document));

	const { data: categories } = useLiveQuery((q) =>
		q
			.from({ document_type: documentTypes })
			.orderBy(({ document_type }) => document_type.name),
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
		navigate({ params: { documentId }, to: "/documents/$documentId" });
	};

	return (
		<div className="space-y-4" {...latchProps}>
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
				formLabel="Edit Document"
				key={seedKey}
				mode="edit"
				onSubmit={handleSubmit}
				submitLabel="Update"
			/>
		</div>
	);
}
