import type { JobPostingStatus } from "@mcmec/lib/functions/job-posting-status";

/**
 * A Job Posting's state, spelled one way.
 *
 * The index and the detail page each carried their own copy of this map, and they disagreed:
 * a Closed posting was `secondary` on the index — under a comment explaining why Refusal Red was
 * wrong for it — and still `destructive` on its own page. The fix had been reasoned out once and
 * applied to one of the two screens.
 *
 * Refusal Red is reserved for destructive commands and validation failures (DESIGN.md). A Closed
 * posting is neither; it is the ordinary end of a hiring round, and spending the system's one
 * alarm colour on it leaves nothing louder for the cases that need it.
 */
export const JOB_POSTING_STATUS_DISPLAY: Record<
	JobPostingStatus,
	{ label: string; variant: "default" | "outline" | "secondary" }
> = {
	closed: { label: "Closed", variant: "secondary" },
	draft: { label: "Draft", variant: "outline" },
	pending: { label: "Pending", variant: "secondary" },
	published: { label: "Published", variant: "default" },
};
