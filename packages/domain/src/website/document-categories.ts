/**
 * `document_types` — the three commands of #134's vocabulary (W-15…17).
 *
 * The same plain three-command shape as `notice-categories`, against a table that differs only
 * in what it groups. The two are kept apart rather than factored into one parameterised module:
 * a command name is a fact about the domain, and `createDocumentCategory` and
 * `createNoticeCategory` being spelled the same way is a coincidence the vocabulary should not
 * encode as a dependency.
 *
 * `id` appears in no payload — it rides in the envelope and names the row the command is about.
 */
import z from "zod";
import { defineDomain } from "../command";

const website = defineDomain("website", "manage_website");

const DetailFields = {
	description: z.string().nullable(),
	name: z.string().min(1),
} as const;

/** The delete command takes no fields — the envelope id is the whole request. */
const EmptyPayload = z.object({});

export const createDocumentCategory = website(
	"createDocumentCategory",
	z.object(DetailFields),
	{ creates: true },
);

export const updateDocumentCategoryDetails = website(
	"updateDocumentCategoryDetails",
	z
		.object(DetailFields)
		.partial()
		.refine((v) => Object.keys(v).length > 0, {
			error: "no fields to update",
		}),
);

export const deleteDocumentCategory = website(
	"deleteDocumentCategory",
	EmptyPayload,
);

export const DOCUMENT_CATEGORY_COMMANDS = [
	createDocumentCategory,
	updateDocumentCategoryDetails,
	deleteDocumentCategory,
] as const;
