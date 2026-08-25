/**
 * `insecticides` — the three commands of #134's vocabulary (W-12…14).
 *
 * A catalogue entry, not an activity: listing an Insecticide is not a record of applying one
 * (CONTEXT.md). So there is no lifecycle and no publish — the same plain three-command shape as
 * the two category tables, over six columns instead of two.
 *
 * The fields are taken from `InsecticidesRowSchema` rather than restated, so the three URL
 * columns keep the one `z.url()` definition the row schema already carries. The form's own
 * minimum lengths on `trade_name`, `type_name` and `active_ingredient` deliberately stay in the
 * form: #134 promoted three named form rules to server preconditions and declined to invent
 * more, and these were not among them.
 *
 * `id` appears in no payload — it rides in the envelope and names the row the command is about.
 */
import { InsecticidesRowSchema } from "@mcmec/schemas/db/insecticides";
import z from "zod";
import { defineDomain } from "../command";

const website = defineDomain("website", "manage_website");

const DetailFields = {
	active_ingredient: InsecticidesRowSchema.shape.active_ingredient,
	active_ingredient_url: InsecticidesRowSchema.shape.active_ingredient_url,
	label_url: InsecticidesRowSchema.shape.label_url,
	msds_url: InsecticidesRowSchema.shape.msds_url,
	trade_name: InsecticidesRowSchema.shape.trade_name,
	type_name: InsecticidesRowSchema.shape.type_name,
} as const;

/** The delete command takes no fields — the envelope id is the whole request. */
const EmptyPayload = z.object({});

export const createInsecticide = website(
	"createInsecticide",
	z.object(DetailFields),
	{ creates: true },
);

/**
 * Partial, because the collection handler sends `mutation.changes`. The non-empty refinement is
 * what makes "an update that asks for nothing" a refusal.
 */
export const updateInsecticideDetails = website(
	"updateInsecticideDetails",
	z
		.object(DetailFields)
		.partial()
		.refine((v) => Object.keys(v).length > 0, {
			error: "no fields to update",
		}),
);

export const deleteInsecticide = website("deleteInsecticide", EmptyPayload);

export const INSECTICIDE_COMMANDS = [
	createInsecticide,
	updateInsecticideDetails,
	deleteInsecticide,
] as const;
