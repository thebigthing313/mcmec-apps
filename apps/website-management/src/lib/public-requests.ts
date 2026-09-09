import type { RequestType } from "@mcmec/schemas/db/public-requests";

/**
 * Display vocabulary for the merged `public_requests` table. The four legacy intake tables
 * are now one table discriminated by `request_type`, with each type's answers in `details`.
 */

/**
 * The four kinds, spelled the way `CONTEXT.md` spells them.
 *
 * "Mosquito Fish" and "Adult Mosquito" were the interface's own words for two of these, and
 * neither is the Commission's: the glossary says *mosquitofish* — one word, the name of the
 * fish — and *adult mosquito nuisance*, which is the complaint rather than the insect.
 */
export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
	adult_mosquito: "Adult Mosquito Nuisance",
	general_inquiry: "General Inquiry",
	mosquito_fish: "Mosquitofish",
	water_management: "Water Management",
};

/**
 * The two states a Public Request has.
 *
 * `CONTEXT.md` is explicit — "A Public Request is either New or Resolved; the Commission does not
 * track work in progress on one" — and ADR 0001 records that the button convention deliberately
 * dropped `in_progress`. It survived here in the display layer, which put a third choice in the
 * status filter that no command could produce, and gave it the filled Commission Green while New,
 * the state that actually needs someone, took the muted variant reserved for finished work.
 *
 * The column's enum still carries `in_progress`, so a legacy row can hold it. `displayStatus`
 * folds it into New rather than pretending it cannot appear — it is a request nobody has resolved,
 * which is what New means.
 */
export const REQUEST_STATUSES = ["new", "resolved"] as const;
export type DisplayRequestStatus = (typeof REQUEST_STATUSES)[number];

export function displayStatus(status: string): DisplayRequestStatus {
	return status === "resolved" ? "resolved" : "new";
}

export const REQUEST_STATUS_LABELS: Record<DisplayRequestStatus, string> = {
	new: "New",
	resolved: "Resolved",
};

/**
 * New is the filled badge and Resolved the muted one, which is the way round every other register
 * in the product reads: the filled Commission Green marks the record that is live work, and the
 * pale variant marks the one that is done with.
 */
export const REQUEST_STATUS_VARIANTS: Record<
	DisplayRequestStatus,
	"default" | "secondary" | "outline"
> = {
	new: "default",
	resolved: "secondary",
};

/** `request_type` is a plain text column, so tolerate a value we don't have a label for. */
export function requestTypeLabel(type: string): string {
	return REQUEST_TYPE_LABELS[type as RequestType] ?? type;
}

/** "isRearOfProperty" -> "Rear Of Property"; "additionalDetails" -> "Additional Details". */
export function humanizeDetailKey(key: string): string {
	const withoutIsPrefix = key.startsWith("is") ? key.slice(2) : key;
	return withoutIsPrefix
		.replace(/([A-Z])/g, " $1")
		.replace(/^./, (c) => c.toUpperCase())
		.trim();
}
