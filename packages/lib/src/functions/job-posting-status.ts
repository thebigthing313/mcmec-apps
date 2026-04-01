export type JobPostingStatus = "closed" | "draft" | "pending" | "published";

export function getJobPostingStatus(posting: {
	is_closed: boolean;
	published_at: Date | null;
}): JobPostingStatus {
	if (posting.is_closed) return "closed";
	if (!posting.published_at) return "draft";
	if (posting.published_at > new Date()) return "pending";
	return "published";
}
