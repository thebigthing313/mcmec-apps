/**
 * PROTOTYPE — throwaway (#299). Fixture data and the one normalized item shape the Calendar
 * draws from. Nothing here reads a collection: Staff Events and Holidays have no tables yet, and
 * the question is how the Calendar looks, not how it loads (that is "Calendar data loading").
 *
 * Meetings, Staff Events and Spray Missions are placed relative to today so the Dashboard always
 * has something upcoming; Holidays are the real 2026 and 2027 lists, and 2028 is left empty on
 * purpose to show the empty year.
 */

export type Source = "staffEvent" | "holiday" | "meeting" | "sprayMission";

/**
 * The normalized shape every source is mapped into. Local calendar dates (`YYYY-MM-DD`) and
 * optional local times (`HH:MM`); no time zone, no Date objects, so a whole-day item can never
 * slide a day.
 */
export type CalendarItem = {
	key: string;
	source: Source;
	title: string;
	startsOn: string;
	/** Same as `startsOn` for a single-day item. */
	endsOn: string;
	startTime?: string;
	endTime?: string;
	/**
	 * `delayed` is the Spray Mission's original date once a rain date is called; `rainDate` is
	 * the extra item the Calendar draws on the rain date itself.
	 */
	status: "normal" | "cancelled" | "delayed" | "rainDate" | "completed";
	location?: string;
	description?: string;
	url?: string;
	/** A Meeting opens its existing Portal page. */
	meetingId?: string;
	mapUrl?: string;
	/** A Holiday's nominal date when it differs from the observed one. */
	fallsOn?: string;
	/** For a delayed mission: the rain date. For a rain-date item: the original date. */
	otherDate?: string;
};

export const SOURCE_LABEL: Record<Source, string> = {
	holiday: "Holiday",
	meeting: "Meeting",
	sprayMission: "Spray Mission",
	staffEvent: "Staff Event",
};

// ── local-date helpers (no date-fns in central) ──────────────────────────────

export function iso(d: Date): string {
	const m = `${d.getMonth() + 1}`.padStart(2, "0");
	const day = `${d.getDate()}`.padStart(2, "0");
	return `${d.getFullYear()}-${m}-${day}`;
}

export function parse(s: string): Date {
	const [y = 0, m = 1, d = 1] = s.split("-").map(Number);
	return new Date(y, m - 1, d);
}

export function addDays(s: string, n: number): string {
	const d = parse(s);
	d.setDate(d.getDate() + n);
	return iso(d);
}

export function todayIso(): string {
	return iso(new Date());
}

export function daysBetween(a: string, b: string): number {
	return Math.round((parse(b).getTime() - parse(a).getTime()) / 86_400_000);
}

export function fmt(s: string, opts: Intl.DateTimeFormatOptions): string {
	return parse(s).toLocaleDateString("en-US", opts);
}

export const fmtShort = (s: string) =>
	fmt(s, { day: "numeric", month: "short", weekday: "short" });
export const fmtLong = (s: string) =>
	fmt(s, { day: "numeric", month: "long", weekday: "long", year: "numeric" });

export function fmtTime(t: string): string {
	const [h = 0, m = 0] = t.split(":").map(Number);
	const suffix = h >= 12 ? "pm" : "am";
	const h12 = h % 12 === 0 ? 12 : h % 12;
	return m === 0
		? `${h12}${suffix}`
		: `${h12}:${`${m}`.padStart(2, "0")}${suffix}`;
}

/** "All day", "9am", "9am–12pm", or a span of dates for a multi-day item. */
export function whenLabel(item: CalendarItem): string {
	const days =
		item.startsOn === item.endsOn
			? ""
			: `${fmtShort(item.startsOn)} – ${fmtShort(item.endsOn)}`;
	const time = item.startTime
		? item.endTime
			? `${fmtTime(item.startTime)}–${fmtTime(item.endTime)}`
			: fmtTime(item.startTime)
		: "All day";
	return days ? `${days}${item.startTime ? `, ${time}` : ""}` : time;
}

// ── fixtures ─────────────────────────────────────────────────────────────────

const T = todayIso();
const d = (n: number) => addDays(T, n);

const HOLIDAYS: Array<[name: string, observedOn: string, fallsOn?: string]> = [
	["New Year's Day", "2026-01-01"],
	["Martin Luther King Jr. Day", "2026-01-19"],
	["Lincoln's Birthday", "2026-02-12"],
	["Presidents' Day", "2026-02-16"],
	["Good Friday", "2026-04-03"],
	["Memorial Day", "2026-05-25"],
	["Juneteenth", "2026-06-19"],
	["Independence Day", "2026-07-03", "2026-07-04"],
	["Labor Day", "2026-09-07"],
	["Columbus Day", "2026-10-12"],
	["Election Day", "2026-11-03"],
	["Veterans Day", "2026-11-11"],
	["Thanksgiving", "2026-11-26"],
	["Day after Thanksgiving", "2026-11-27"],
	["Christmas Day", "2026-12-25"],
	["Martin Luther King Jr. Day", "2027-01-18"],
	["New Year's Day", "2027-01-01"],
	["Lincoln's Birthday", "2027-02-12"],
	["Presidents' Day", "2027-02-15"],
	["Good Friday", "2027-03-26"],
	["Memorial Day", "2027-05-31"],
	["Juneteenth", "2027-06-18", "2027-06-19"],
	["Independence Day", "2027-07-05", "2027-07-04"],
	["Labor Day", "2027-09-06"],
	["Columbus Day", "2027-10-11"],
	["Election Day", "2027-11-02"],
	["Veterans Day", "2027-11-11"],
	["Thanksgiving", "2027-11-25"],
	["Day after Thanksgiving", "2027-11-26"],
	["Christmas Day", "2027-12-24", "2027-12-25"],
	// New Year's Day 2028 is a Saturday: observed Fri Dec 31, so it belongs to 2027.
	["New Year's Day", "2027-12-31", "2028-01-01"],
];

export const holidays: CalendarItem[] = HOLIDAYS.map(
	([title, observedOn, fallsOn]) => ({
		endsOn: observedOn,
		fallsOn,
		key: `holiday-${observedOn}`,
		source: "holiday",
		startsOn: observedOn,
		status: "normal",
		title,
	}),
);

const staffEvents: CalendarItem[] = [
	{
		description: "Annual refresher. Bring your respirator for the fit test.",
		endTime: "12:00",
		location: "Headquarters, training room",
		startTime: "09:00",
		title: "OSHA safety refresher",
	},
	{
		description: "Category 8 CORE credits. Register before Friday.",
		endTime: "15:00",
		startTime: "13:00",
		title: "Pesticide recertification webinar",
		url: "https://example.org/register",
	},
	{
		description: "Called off; a new date will be posted.",
		location: "Headquarters, garage bay",
		startTime: "12:00",
		status: "cancelled" as const,
		title: "Season wrap-up lunch",
	},
	{
		description: "Trade show and sessions. Carpool sign-up in the break room.",
		location: "Atlantic City Convention Center",
		title: "NJMCA Annual Meeting",
		url: "https://example.org/njmca",
	},
	{
		description: "Bring last season's trap counts.",
		endTime: "16:00",
		location: "Rutgers, Thompson Hall",
		startTime: "08:30",
		title: "Rutgers Mosquito Short Course",
	},
	{
		title: "Vehicle inspections",
		location: "Headquarters, yard",
	},
].map((e, i) => {
	const offsets: Array<[number, number]> = [
		[1, 1],
		[6, 6],
		[15, 15],
		[20, 22],
		[25, 28],
		[8, 8],
	];
	const [s, en] = offsets[i] ?? [0, 0];
	return {
		...e,
		endsOn: d(en),
		key: `event-${i}`,
		source: "staffEvent" as const,
		startsOn: d(s),
		status: e.status ?? "normal",
	};
});

const meetings: CalendarItem[] = [
	{ n: -13, title: "Regular Meeting", cancelled: false },
	{ n: 3, title: "Finance Committee", cancelled: true },
	{ n: 8, title: "Regular Meeting", cancelled: false },
	{ n: 22, title: "Special Meeting", cancelled: false },
].map((m, i) => ({
	endsOn: d(m.n),
	key: `meeting-${i}`,
	location: "Headquarters, board room",
	meetingId: `fixture-${i}`,
	source: "meeting",
	startTime: "19:00",
	startsOn: d(m.n),
	status: m.cancelled ? "cancelled" : "normal",
	title: m.title,
}));

const MISSIONS: Array<{
	n: number;
	area: string;
	status: "scheduled" | "delayed" | "cancelled" | "completed";
	rain?: number;
}> = [
	{ area: "Edison, Metuchen", n: -2, status: "completed" },
	{ area: "Old Bridge (Laurence Harbor)", n: 0, status: "scheduled" },
	{ area: "Piscataway, Highland Park", n: 4, rain: 5, status: "delayed" },
	{ area: "South Brunswick", n: 8, status: "scheduled" },
	{ area: "Sayreville, South Amboy", n: 10, status: "cancelled" },
];

const sprayMissions: CalendarItem[] = MISSIONS.flatMap((m, i) => {
	const base = {
		description: "Adulticide, ULV truck. Residents notified 24h ahead.",
		endTime: "23:00",
		location: m.area,
		mapUrl: "https://example.org/map.pdf",
		source: "sprayMission" as const,
		startTime: "19:30",
		title: `Spraying: ${m.area}`,
	};
	const own: CalendarItem = {
		...base,
		endsOn: d(m.n),
		key: `mission-${i}`,
		otherDate: m.rain === undefined ? undefined : d(m.rain),
		startsOn: d(m.n),
		status: m.status === "scheduled" ? "normal" : m.status,
	};
	if (m.rain === undefined) return [own];
	return [
		own,
		{
			...base,
			endsOn: d(m.rain),
			key: `mission-${i}-rain`,
			otherDate: d(m.n),
			startsOn: d(m.rain),
			status: "rainDate",
		},
	];
});

export const allItems: CalendarItem[] = [
	...holidays,
	...staffEvents,
	...meetings,
	...sprayMissions,
].sort(compareItems);

export function compareItems(a: CalendarItem, b: CalendarItem): number {
	if (a.startsOn !== b.startsOn) return a.startsOn < b.startsOn ? -1 : 1;
	// Whole-day items (Holidays, all-day events) lead the day.
	const at = a.startTime ?? "";
	const bt = b.startTime ?? "";
	return at < bt ? -1 : at > bt ? 1 : 0;
}

/** Items touching any day in [from, to]. */
export function itemsBetween(from: string, to: string): CalendarItem[] {
	return allItems.filter((i) => i.endsOn >= from && i.startsOn <= to);
}

export function itemsOn(day: string): CalendarItem[] {
	return itemsBetween(day, day);
}

// ── month grid geometry ──────────────────────────────────────────────────────

/** The Sunday-start weeks covering a month, as arrays of 7 ISO dates. */
export function monthWeeks(month: string): string[][] {
	const first = parse(`${month}-01`);
	const start = addDays(iso(first), -first.getDay());
	const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
	const end = addDays(iso(last), 6 - last.getDay());
	const weeks: string[][] = [];
	for (let day = start; day <= end; day = addDays(day, 7)) {
		weeks.push(Array.from({ length: 7 }, (_, i) => addDays(day, i)));
	}
	return weeks;
}

export type Segment = {
	item: CalendarItem;
	/** 0–6 */
	col: number;
	span: number;
	lane: number;
	continuesBefore: boolean;
	continuesAfter: boolean;
};

/**
 * Cuts each item to the week, then packs the pieces into lanes: longest first, each into the
 * lowest lane that is free across all of its days. This is the small testable function the
 * research ticket predicted.
 */
export function packWeek(week: string[], items: CalendarItem[]): Segment[] {
	const from = week[0] as string;
	const to = week[6] as string;
	const pieces = items
		.filter((i) => i.endsOn >= from && i.startsOn <= to)
		.map((item) => {
			const s = item.startsOn < from ? from : item.startsOn;
			const e = item.endsOn > to ? to : item.endsOn;
			return {
				col: daysBetween(from, s),
				continuesAfter: item.endsOn > to,
				continuesBefore: item.startsOn < from,
				item,
				span: daysBetween(s, e) + 1,
			};
		})
		.sort((a, b) => a.col - b.col || b.span - a.span);
	const lanes: boolean[][] = [];
	return pieces.map((p) => {
		let lane = 0;
		for (;;) {
			lanes[lane] ??= Array(7).fill(false);
			const row = lanes[lane] as boolean[];
			if (row.slice(p.col, p.col + p.span).every((x) => !x)) {
				for (let c = p.col; c < p.col + p.span; c++) row[c] = true;
				break;
			}
			lane++;
		}
		return { ...p, lane };
	});
}

export function shiftMonth(month: string, n: number): string {
	const [y = 0, m = 1] = month.split("-").map(Number);
	const dt = new Date(y, m - 1 + n, 1);
	return iso(dt).slice(0, 7);
}

export const fmtMonth = (month: string) =>
	fmt(`${month}-01`, { month: "long", year: "numeric" });
