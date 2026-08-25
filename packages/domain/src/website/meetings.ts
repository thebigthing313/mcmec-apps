/**
 * `meetings` — the five commands of #134's vocabulary.
 *
 * `is_cancelled` is omitted from `updateMeetingDetails` on purpose: with it absent from the
 * payload schema, the lifecycle column can only move through `cancelMeeting` /
 * `uncancelMeeting`, so the split is enforced by construction rather than by discipline. It
 * was a `SwitchField` on the edit form until this pair existed — the exact conflation ADR 0001
 * names.
 *
 * `notes` stays an ordinary detail field. It is not a lifecycle column: an uncancelled meeting
 * may carry notes, and the cancellation reason is simply what it holds once the meeting is
 * cancelled. `cancelMeeting` therefore takes no payload — the rule that a cancellation needs a
 * reason is a precondition on STORED notes, checked in the handler, the same shape as
 * `archiveNotice`'s retention rule. A Save-and-Cancel sends both intents in one transaction,
 * with `updateMeetingDetails` first, so notes typed in the form are on the row before the
 * precondition reads them.
 *
 * `meeting_at` is a `timestamp`, not a `date` column in string mode: the payload arrives as an
 * ISO string, `z.coerce.date` turns it into a Date here, and `toColumnValues` then leaves it
 * alone (it only coerces strings). Drizzle wants the Date, so the two agree. This column has
 * broken once already — before `coerceDates` existed on the generic path, `meeting_at` being
 * NOT NULL made meetings entirely unwritable (#133).
 *
 * `id` appears in no payload — it rides in the envelope and names the row the command is about.
 */
import { MeetingsRowSchema } from "@mcmec/schemas/db/meetings";
import z from "zod";
import { defineDomain } from "../command";

const website = defineDomain("website", "manage_website");

const DetailFields = {
	location: MeetingsRowSchema.shape.location,
	meeting_at: MeetingsRowSchema.shape.meeting_at,
	// The two external links keep the one `z.url().nullable()` the row schema already carries;
	// the form's own minimum lengths on `name` and `location` deliberately stay in the form
	// (#134 promoted three named form rules and declined to invent more).
	minutes_url: MeetingsRowSchema.shape.minutes_url,
	name: MeetingsRowSchema.shape.name,
	notes: MeetingsRowSchema.shape.notes,
	notice_url: MeetingsRowSchema.shape.notice_url,
} as const;

/** The lifecycle commands take no fields — the envelope id is the whole request. */
const EmptyPayload = z.object({});

export const createMeeting = website(
	"createMeeting",
	// No `is_cancelled`, unlike `createDocument`'s `is_published`: creation may set initial
	// state where the UI genuinely offers the choice, and nobody schedules a meeting in order
	// to cancel it. A meeting is born scheduled.
	z.object(DetailFields),
	{ creates: true },
);

/**
 * Partial, because the collection handler sends `mutation.changes` — a notes-only edit carries
 * one key. The non-empty refinement is what makes "an update that asks for nothing" a refusal.
 */
export const updateMeetingDetails = website(
	"updateMeetingDetails",
	z
		.object(DetailFields)
		.partial()
		.refine((v) => Object.keys(v).length > 0, {
			error: "no fields to update",
		}),
);

export const cancelMeeting = website("cancelMeeting", EmptyPayload);
export const uncancelMeeting = website("uncancelMeeting", EmptyPayload);
export const deleteMeeting = website("deleteMeeting", EmptyPayload);

export const MEETING_COMMANDS = [
	createMeeting,
	updateMeetingDetails,
	cancelMeeting,
	uncancelMeeting,
	deleteMeeting,
] as const;
