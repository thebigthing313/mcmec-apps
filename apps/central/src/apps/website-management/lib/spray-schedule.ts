/**
 * Spray Mission presentation, shared by the index, the detail view, and the dashboard.
 *
 * These used to live inside `spray-schedule-table.tsx`, which meant the detail screen and the
 * dashboard both imported a table component to borrow two functions from it. The table is gone
 * now — every index composes `RecordIndex` — so they live where shared domain formatting belongs.
 */

/** One status reads the same colour on the index, the detail view, and the dashboard. */
export function statusBadgeVariant(
	status: string,
): "default" | "secondary" | "outline" | "destructive" {
	switch (status) {
		case "scheduled":
			return "default";
		case "delayed":
			return "outline";
		// Not `destructive`. Refusal Red is reserved for destructive commands and validation
		// failures (DESIGN.md), and a cancelled mission is neither — it is a mission that was
		// called off, which is exactly what a cancelled Meeting is, and that badge is muted.
		case "cancelled":
			return "secondary";
		case "completed":
			return "secondary";
		default:
			return "outline";
	}
}

/**
 * "8:30 PM – 1:00 AM".
 *
 * `start_time` and `end_time` are Postgres `time` columns, so they arrive as `"HH:MM:SS"` strings
 * rather than Dates — the date helpers do not apply to them.
 */
export function formatTimeRange(startTime: string, endTime: string): string {
	const format = (t: string) => {
		const parts = t.split(":");
		const h = Number.parseInt(parts[0] ?? "0", 10);
		const ampm = h >= 12 ? "PM" : "AM";
		const h12 = h % 12 || 12;
		return `${h12}:${parts[1] ?? "00"} ${ampm}`;
	};
	return `${format(startTime)} – ${format(endTime)}`;
}

/** Sentence-case a status enum value for display — "scheduled" reads as "Scheduled". */
export function statusLabel(status: string): string {
	return status.charAt(0).toUpperCase() + status.slice(1);
}
