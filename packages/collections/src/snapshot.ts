/**
 * One-shot shape read, for callers that want the current rows rather than a live
 * collection — server-side rendering, most of all.
 *
 * A collection keeps a stream open and re-renders as rows change; an SSR pass just needs
 * the data once, in the response. This subscribes, waits for the shape to report
 * up-to-date, then aborts the stream so no long-poll outlives the request.
 *
 * Runs anywhere `fetch` exists, and carries no session — the shape proxy applies its
 * anonymous policy (published-only rows for notices, documents, and job postings).
 */
import { type Row, Shape, ShapeStream } from "@electric-sql/client";
import { electricParser } from "./collections";

export interface FetchShapeSnapshotOptions {
	/** Table name — the `/api/shapes/:table` segment. */
	table: string;
	/** API origin. */
	apiUrl: string;
	/** Abort the underlying request early (e.g. a cancelled SSR render). */
	signal?: AbortSignal;
}

export async function fetchShapeSnapshot<T extends Row = Row>({
	apiUrl,
	signal,
	table,
}: FetchShapeSnapshotOptions): Promise<T[]> {
	// Our own controller so the stream can be closed once the snapshot lands; an external
	// signal still aborts it.
	const controller = new AbortController();
	const abort = () => controller.abort();
	signal?.addEventListener("abort", abort, { once: true });

	try {
		const stream = new ShapeStream<T>({
			url: `${apiUrl}/api/shapes/${table}`,
			// Same coercions the collections use, so SSR and client rows agree.
			parser: electricParser as never,
			signal: controller.signal,
		});
		const shape = new Shape(stream);
		return await shape.rows;
	} finally {
		// Resolved or threw, we're done with the stream either way.
		controller.abort();
		signal?.removeEventListener("abort", abort);
	}
}
