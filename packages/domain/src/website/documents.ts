/**
 * `documents` — the five commands of #134's vocabulary (W-12…14, plus the publish pair).
 *
 * `is_published` is omitted from `updateDocumentDetails` on purpose: with it absent from the
 * payload schema, the lifecycle column can only move through a named command, so the split is
 * enforced by construction rather than by discipline.
 *
 * A document is a *link*, not a file — `documents.url` is a plain external URL column (the row
 * points at a Google Drive or county-hosted artifact). Nothing here touches storage, so no
 * command in this module needs #137's `AfterCommit` thunk.
 *
 * `id` appears in no payload — it rides in the envelope and names the row the command is about.
 */
import { DocumentsRowSchema } from "@mcmec/schemas/db/documents";
import z from "zod";
import { defineDomain } from "../command";

const website = defineDomain("website", "manage_website");

const DetailFields = {
	// A plain uuid, not a narrower check against the live `document_types` set: the FK already
	// refuses an id that names no category, and it does so against the same transaction's view
	// of the table rather than against a list this schema would have to be handed.
	document_type_id: DocumentsRowSchema.shape.document_type_id,
	// The form already bounds this; the command restates it because a payload schema is the
	// only bound that survives a caller that is not the form.
	fiscal_year: z.number().int().min(2000).max(2100),
	url: DocumentsRowSchema.shape.url,
} as const;

/** The lifecycle commands take no fields — the envelope id is the whole request. */
const EmptyPayload = z.object({});

export const createDocument = website(
	"createDocument",
	z.object({
		...DetailFields,
		// Creation is not a transition, so a create may set initial state where the UI
		// genuinely offers the choice — and the document form does.
		is_published: z.boolean(),
	}),
	{ creates: true },
);

/**
 * Partial, because the collection handler sends `mutation.changes` — a url-only edit carries
 * one key. The non-empty refinement is what makes "an update that asks for nothing" a refusal.
 */
export const updateDocumentDetails = website(
	"updateDocumentDetails",
	z
		.object(DetailFields)
		.partial()
		.refine((v) => Object.keys(v).length > 0, {
			error: "no fields to update",
		}),
);

export const publishDocument = website("publishDocument", EmptyPayload);
export const unpublishDocument = website("unpublishDocument", EmptyPayload);
export const deleteDocument = website("deleteDocument", EmptyPayload);

export const DOCUMENT_COMMANDS = [
	createDocument,
	updateDocumentDetails,
	publishDocument,
	unpublishDocument,
	deleteDocument,
] as const;
