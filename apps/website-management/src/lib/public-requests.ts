import type {
	RequestStatus,
	RequestType,
} from "@mcmec/supabase/db/public-requests";

/**
 * Display vocabulary for the merged `public_requests` table. The four legacy intake tables
 * are now one table discriminated by `request_type`, with each type's answers in `details`.
 */

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
	adult_mosquito: "Adult Mosquito",
	general_inquiry: "General Inquiry",
	mosquito_fish: "Mosquito Fish",
	water_management: "Water Management",
};

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
	in_progress: "In Progress",
	new: "New",
	resolved: "Resolved",
};

export const REQUEST_STATUS_VARIANTS: Record<
	RequestStatus,
	"default" | "secondary" | "outline"
> = {
	in_progress: "default",
	new: "secondary",
	resolved: "outline",
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
