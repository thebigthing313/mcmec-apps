import { PublicRequestsRowSchema } from "@mcmec/schemas/db/public-requests";
import { createOnDemandCollection } from "../electric-collection";

/**
 * Public Requests, minted by the public website through POST /api/requests (#164) and triaged
 * in Website Management. On demand, because the table only grows: a screen's live query pulls
 * its slice through the proxy's `subset__*` params — see `createOnDemandCollection`.
 */
export function create(apiUrl: string) {
	return createOnDemandCollection({
		apiUrl,
		commands: true,
		schema: PublicRequestsRowSchema,
		table: "public_requests",
	});
}
