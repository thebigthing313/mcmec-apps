import {
	defaultMeetingPeriod,
	keepMeetingPeriod,
	type MeetingPeriod,
	meetingPeriods,
	UPCOMING,
} from "@mcmec/lib/functions/meeting-periods";
import * as React from "react";
import type { MeetingTableRowType } from "../blocks/meetings-table";

const meetingDate = (meeting: MeetingTableRowType) => meeting.meetingAt;

/** The selector's `<Select>` value for a period — its label is the reader's half. */
export function meetingPeriodValue(period: MeetingPeriod | null): string {
	return period === null ? "" : `${period}`;
}

/** Read a period back out of the selector. */
export function parseMeetingPeriodValue(value: string): MeetingPeriod {
	return value === UPCOMING ? UPCOMING : Number(value);
}

/**
 * The meetings-page period selector, shared so the table and the mobile list cannot
 * drift apart.
 *
 * Nothing is chosen until the reader chooses it: the period in play is derived from the
 * options each render, so it follows the data rather than the wall clock and can never
 * be a period the selector does not offer.
 */
export function useMeetingPeriod(data: MeetingTableRowType[]) {
	// One instant for the life of the component. Reading the clock afresh each render
	// would let a meeting cross out of "Upcoming" mid-render, and would defeat the memos.
	const [now] = React.useState(() => new Date());

	const periods = React.useMemo(
		() => meetingPeriods(data, meetingDate, now),
		[data, now],
	);
	const [chosen, setChosen] = React.useState<MeetingPeriod | null>(null);

	const period =
		chosen !== null && periods.includes(chosen)
			? chosen
			: defaultMeetingPeriod(periods);

	const meetings = React.useMemo(
		() => keepMeetingPeriod(data, meetingDate, period, now),
		[data, now, period],
	);

	return { meetings, period, periods, setPeriod: setChosen };
}
