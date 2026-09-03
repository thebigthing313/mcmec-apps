/**
 * What a reader of the public spray schedule is looking at.
 *
 * The page used to render every mission of the current year in one reverse-chronological
 * list, so the card at the top was the furthest-out or most recently past mission rather
 * than the next one. A resident's question is "is my street being sprayed", which is a
 * question about what is still to come; answering it required reading dates down a mixed
 * list and comparing each to today.
 *
 * Upcoming and Past are the only two groups here, and deliberately so. A "Tonight" group
 * cannot be stated truthfully: missions run overnight — 3am–8am as readily as 7pm–midnight
 * — so a mission dated the 4th starting at 3am is, to the person who sees the truck, the
 * night of the 3rd. Any "tonight" label is therefore wrong for a large share of missions,
 * and wrong in the direction that tells a resident they are clear when they are not.
 * "Upcoming" carries no such claim: it is purely relative to now.
 *
 * Mission `status` is not consulted anywhere in this module. It is an authored lifecycle
 * value that staff advance by hand (ADR 0001), so a mission whose date has passed can
 * legitimately still read "Scheduled" while it waits to be marked completed. Grouping is
 * about the clock; the badge is about the record. Deriving one from the other would turn
 * a deliberate act into a computed field.
 */

/** The clock facts a mission needs to be placed in time. `HH:MM` or `HH:MM:SS`. */
export interface SprayMissionTimes {
	missionDate: Date;
	startTime: string;
	endTime: string;
}

/** Which side of now a mission falls on. */
export type SprayPeriod = "upcoming" | "past";

/** Minutes since midnight, or null when the string is not a time we understand. */
function minutesSinceMidnight(time: string): number | null {
	const [rawHours, rawMinutes] = time.split(":");
	const hours = Number.parseInt(rawHours ?? "", 10);
	const minutes = Number.parseInt(rawMinutes ?? "0", 10);

	if (Number.isNaN(hours)) {
		return null;
	}

	return hours * 60 + (Number.isNaN(minutes) ? 0 : minutes);
}

/**
 * The moment a mission finishes.
 *
 * An end earlier in the clock than its start means the mission crossed midnight, so it
 * ends on the following day: 7pm–midnight and 9pm–2am both belong to the evening they
 * started. Without this a mission in progress drops into Past at midnight while the
 * trucks are still out.
 *
 * An unparseable end time falls back to the end of the mission's own day rather than
 * throwing — a malformed row should misplace one card, not blank the page.
 */
export function missionEndsAt({
	missionDate,
	startTime,
	endTime,
}: SprayMissionTimes): Date {
	const end = new Date(missionDate);
	const endMinutes = minutesSinceMidnight(endTime);

	if (endMinutes === null) {
		end.setHours(23, 59, 59, 999);
		return end;
	}

	end.setHours(Math.floor(endMinutes / 60), endMinutes % 60, 0, 0);

	const startMinutes = minutesSinceMidnight(startTime);
	if (startMinutes !== null && endMinutes < startMinutes) {
		end.setDate(end.getDate() + 1);
	}

	return end;
}

/**
 * Which group a mission belongs to.
 *
 * The boundary is the mission's end, not its date, so a mission stays Upcoming for as
 * long as it is actually running.
 */
export function sprayPeriodOf(
	times: SprayMissionTimes,
	now: Date = new Date(),
): SprayPeriod {
	return missionEndsAt(times).getTime() >= now.getTime() ? "upcoming" : "past";
}

/**
 * The missions split into the two groups the page renders, each in its own order.
 *
 * Upcoming runs soonest first, because the next mission is the one being asked about.
 * Past runs most recent first, because a reader looking back starts from what just
 * happened. Ties break on start time so two missions on one date keep a stable order.
 */
export function partitionSprayMissions<T>(
	items: readonly T[],
	getTimes: (item: T) => SprayMissionTimes,
	now: Date = new Date(),
): { upcoming: T[]; past: T[] } {
	const upcoming: T[] = [];
	const past: T[] = [];

	for (const item of items) {
		if (sprayPeriodOf(getTimes(item), now) === "upcoming") {
			upcoming.push(item);
		} else {
			past.push(item);
		}
	}

	const startsAt = (item: T) => {
		const times = getTimes(item);
		const date = new Date(times.missionDate);
		const minutes = minutesSinceMidnight(times.startTime) ?? 0;
		date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
		return date.getTime();
	};

	upcoming.sort((a, b) => startsAt(a) - startsAt(b));
	past.sort((a, b) => startsAt(b) - startsAt(a));

	return { upcoming, past };
}

/** The heading a group carries. */
export function sprayPeriodLabel(period: SprayPeriod): string {
	return period === "upcoming"
		? "Upcoming spray missions"
		: "Past spray missions";
}

/** The count beside a group's heading. */
export function sprayPeriodCountLabel(
	count: number,
	period: SprayPeriod,
): string {
	const missions = `mission${count === 1 ? "" : "s"}`;

	return period === "upcoming"
		? `${count} upcoming ${missions}`
		: `${count} past ${missions}`;
}

/**
 * What an empty group says instead of cards.
 *
 * The upcoming wording is the reassurance the page has never offered: with no such line,
 * "nothing is scheduled" and "the page failed to tell me anything" look identical to a
 * resident checking before bed.
 */
export function emptySprayPeriodLabel(period: SprayPeriod): string {
	return period === "upcoming"
		? "No upcoming spray missions scheduled."
		: "No past spray missions this year.";
}

/** What the page says when a filter matches nothing, as opposed to there being nothing. */
export const NO_MISSIONS_MATCHING_FILTERS =
	"No spray missions match your filters.";
