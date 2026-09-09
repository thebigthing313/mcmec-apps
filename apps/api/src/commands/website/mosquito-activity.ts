/**
 * The handler for the one command that replaces a dataset rather than editing a row.
 *
 * This is `apps/api/src/mosquito.ts` with everything the dispatcher already owns taken out of
 * it — the permission check, the transaction, the actor GUCs and the txid. What is left is the
 * write itself: delete the years the file names, insert the file. Both halves run inside the
 * request's shared transaction, so a season is never half-replaced.
 *
 * The insert is chunked because a single statement carrying 20,000 rows means 120,000 bind
 * parameters, which is past what the protocol will carry. The chunk size is the retired
 * endpoint's, and it is a fact about the driver rather than a policy about the data.
 */
import type { mosquitoActivity as mosquitoCommands } from "@mcmec/domain";
import { inArray } from "drizzle-orm";
import { mosquitoActivityData } from "../../db/schema";
import { toColumnValues } from "../columns";
import type { CommandHandler } from "../types";

/** Rows per insert statement. */
const CHUNK = 500;

export const importMosquitoActivity: CommandHandler<
	typeof mosquitoCommands.importMosquitoActivity
> = async ({ payload, tx }) => {
	const years = [...new Set(payload.rows.map((row) => row.year))];
	const values = payload.rows.map(
		(row) =>
			toColumnValues(
				mosquitoActivityData,
				row,
			) as typeof mosquitoActivityData.$inferInsert,
	);

	// Delete first, and by year rather than by id: the file is the season now, so a row that
	// was in last week's import and is not in this one has to go.
	await tx
		.delete(mosquitoActivityData)
		.where(inArray(mosquitoActivityData.year, years));
	for (let i = 0; i < values.length; i += CHUNK) {
		await tx.insert(mosquitoActivityData).values(values.slice(i, i + CHUNK));
	}
};
