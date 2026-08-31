/**
 * A Meeting's state, derived rather than stored, and spelled one way.
 *
 * It lived inside the index route while the detail page rendered its own two-way badge, so the
 * same meeting was "Pending" on one screen and "Scheduled" on the other — and a meeting whose
 * date had passed read "Past" on the index and "Scheduled" on its own page, which was simply
 * wrong.
 *
 * **Scheduled, not Pending.** "Pending" is already taken: over in Notices it means *published
 * against a future date* — committed, but not yet on the public site. One word carrying two
 * unrelated meanings two registers apart is the kind of drift that makes a reader re-learn the
 * vocabulary per screen.
 *
 * A Cancelled Meeting keeps its badge and its place on both this list and the public site: the
 * record is the product, and the public has to be able to see that a meeting was called and then
 * called off.
 */
export function meetingStatus(meeting: {
	isCancelled: boolean;
	meetingAt: Date;
}): {
	label: string;
	variant: "default" | "secondary" | "outline";
} {
	if (meeting.isCancelled) return { label: "Cancelled", variant: "secondary" };
	if (meeting.meetingAt < new Date()) {
		return { label: "Past", variant: "outline" };
	}
	return { label: "Scheduled", variant: "default" };
}
