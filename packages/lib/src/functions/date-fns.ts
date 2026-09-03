/**
 * Where the Commission sits, and therefore when its meetings happen.
 *
 * Named rather than inlined because it is a fact about the agency, not a formatting option:
 * every meeting on the public record is called in Edison, New Jersey.
 */
export const COMMISSION_TIME_ZONE = "America/New_York";

/**
 * Timezone-safe date utility functions
 *
 * These functions help avoid common timezone-related bugs when working with dates.
 * The key principle is to treat date-only values as UTC dates at midnight to avoid
 * timezone shifts that can cause dates to display incorrectly.
 */

/**
 * Format a date as a localized date string (no time component).
 * Uses UTC to avoid timezone shifts for date-only values.
 *
 * @param date - The date to format (can be Date, string, or null/undefined)
 * @param locale - The locale to use for formatting (defaults to 'en-US')
 * @returns Formatted date string or empty string if date is invalid
 *
 * @example
 * formatDate(new Date('2026-01-15')) // "January 15, 2026"
 * formatDate('2026-01-15') // "January 15, 2026"
 * formatDate(null) // ""
 */
export function formatDate(
	date: Date | string | null | undefined,
	locale = "en-US",
): string {
	if (!date) {
		return "";
	}

	const dateObj = typeof date === "string" ? new Date(date) : date;

	if (Number.isNaN(dateObj.getTime())) {
		return "";
	}

	return dateObj.toLocaleDateString(locale, {
		day: "2-digit",
		month: "long",
		timeZone: "UTC",
		year: "numeric",
	});
}

/**
 * Format a date as a short localized date string (no time component).
 * Uses UTC to avoid timezone shifts for date-only values.
 *
 * @param date - The date to format (can be Date, string, or null/undefined)
 * @param locale - The locale to use for formatting (defaults to 'en-US')
 * @returns Formatted date string or empty string if date is invalid
 *
 * @example
 * formatDateShort(new Date('2026-01-15')) // "1/15/2026"
 * formatDateShort('2026-01-15') // "1/15/2026"
 */
export function formatDateShort(
	date: Date | string | null | undefined,
	locale = "en-US",
): string {
	if (!date) {
		return "";
	}

	const dateObj = typeof date === "string" ? new Date(date) : date;

	if (Number.isNaN(dateObj.getTime())) {
		return "";
	}

	return dateObj.toLocaleDateString(locale, {
		timeZone: "UTC",
	});
}

/**
 * Format a time from a date object as HH:MM:SS.
 * Uses local time zone for time display.
 *
 * @param date - The date to extract time from
 * @returns Formatted time string in HH:MM:SS format
 *
 * @example
 * formatTime(new Date('2026-01-15T14:30:45')) // "14:30:45"
 */
export function formatTime(date: Date | undefined): string {
	if (!date) {
		return "00:00:00";
	}

	const hours = date.getHours().toString().padStart(2, "0");
	const minutes = date.getMinutes().toString().padStart(2, "0");
	const seconds = date.getSeconds().toString().padStart(2, "0");

	return `${hours}:${minutes}:${seconds}`;
}

/**
 * Parse a time string (HH:MM or HH:MM:SS) and apply it to a date.
 * Preserves the date component while updating the time.
 *
 * @param date - The base date (or undefined to use current date)
 * @param timeString - Time string in HH:MM or HH:MM:SS format
 * @returns New Date object with updated time
 *
 * @example
 * parseTimeToDate(new Date('2026-01-15'), '14:30:45')
 * // Returns Date with date 2026-01-15 and time 14:30:45
 */
export function parseTimeToDate(
	date: Date | undefined,
	timeString: string,
): Date {
	const [hours = "0", minutes = "0", seconds = "0"] = timeString.split(":");
	const newDate = date ? new Date(date) : new Date();

	newDate.setHours(Number.parseInt(hours, 10));
	newDate.setMinutes(Number.parseInt(minutes, 10));
	newDate.setSeconds(Number.parseInt(seconds, 10));

	return newDate;
}

/**
 * Create a date at the start of day (00:00:00) in UTC.
 * Useful for date-only comparisons without timezone effects.
 *
 * @param date - The date to normalize
 * @returns New Date object set to midnight UTC
 *
 * @example
 * getStartOfDayUTC(new Date('2026-01-15T14:30:00'))
 * // Returns 2026-01-15T00:00:00.000Z
 */
export function getStartOfDayUTC(date: Date | string): Date {
	const dateObj = typeof date === "string" ? new Date(date) : new Date(date);
	return new Date(
		Date.UTC(
			dateObj.getUTCFullYear(),
			dateObj.getUTCMonth(),
			dateObj.getUTCDate(),
			0,
			0,
			0,
			0,
		),
	);
}

/**
 * Get today's date at midnight UTC.
 * Useful for comparing dates without time components.
 *
 * @returns Date object representing today at 00:00:00 UTC
 *
 * @example
 * getTodayUTC() // Returns today's date at midnight UTC
 */
export function getTodayUTC(): Date {
	const now = new Date();
	return new Date(
		Date.UTC(
			now.getUTCFullYear(),
			now.getUTCMonth(),
			now.getUTCDate(),
			0,
			0,
			0,
			0,
		),
	);
}

/**
 * Compare two dates ignoring time components.
 * Returns true if both dates represent the same calendar day (UTC).
 *
 * @param date1 - First date to compare
 * @param date2 - Second date to compare
 * @returns true if dates are the same day, false otherwise
 *
 * @example
 * isSameDay(new Date('2026-01-15T10:00:00'), new Date('2026-01-15T20:00:00'))
 * // Returns true
 */
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
	const d1 = getStartOfDayUTC(date1);
	const d2 = getStartOfDayUTC(date2);
	return d1.getTime() === d2.getTime();
}

/**
 * Check if a date is before another date (ignoring time).
 *
 * @param date - The date to check
 * @param compareDate - The date to compare against
 * @returns true if date is before compareDate
 *
 * @example
 * isBeforeDay(new Date('2026-01-14'), new Date('2026-01-15'))
 * // Returns true
 */
export function isBeforeDay(
	date: Date | string,
	compareDate: Date | string,
): boolean {
	const d1 = getStartOfDayUTC(date);
	const d2 = getStartOfDayUTC(compareDate);
	return d1.getTime() < d2.getTime();
}

/**
 * Check if a date is after another date (ignoring time).
 *
 * @param date - The date to check
 * @param compareDate - The date to compare against
 * @returns true if date is after compareDate
 *
 * @example
 * isAfterDay(new Date('2026-01-16'), new Date('2026-01-15'))
 * // Returns true
 */
export function isAfterDay(
	date: Date | string,
	compareDate: Date | string,
): boolean {
	const d1 = getStartOfDayUTC(date);
	const d2 = getStartOfDayUTC(compareDate);
	return d1.getTime() > d2.getTime();
}

/**
 * Check if a date is on or before another date (ignoring time).
 *
 * @param date - The date to check
 * @param compareDate - The date to compare against
 * @returns true if date is on or before compareDate
 *
 * @example
 * isOnOrBeforeDay(new Date('2026-01-15'), new Date('2026-01-15'))
 * // Returns true
 */
export function isOnOrBeforeDay(
	date: Date | string,
	compareDate: Date | string,
): boolean {
	const d1 = getStartOfDayUTC(date);
	const d2 = getStartOfDayUTC(compareDate);
	return d1.getTime() <= d2.getTime();
}

/**
 * Check if a date is on or after another date (ignoring time).
 *
 * @param date - The date to check
 * @param compareDate - The date to compare against
 * @returns true if date is on or after compareDate
 *
 * @example
 * isOnOrAfterDay(new Date('2026-01-15'), new Date('2026-01-15'))
 * // Returns true
 */
export function isOnOrAfterDay(
	date: Date | string,
	compareDate: Date | string,
): boolean {
	const d1 = getStartOfDayUTC(date);
	const d2 = getStartOfDayUTC(compareDate);
	return d1.getTime() >= d2.getTime();
}

/**
 * Format a date with time as a localized date and time string with timezone.
 * Displays full date, time, and timezone abbreviation.
 *
 * Pinned to the Commission's own timezone, for two reasons.
 *
 * It used to pin none, which meant it rendered in whatever zone the runtime happened to be
 * in. On `apps/public` that is a real defect rather than a cosmetic one: the SSR server runs
 * in UTC, so the server-rendered HTML showed a 12:00 PM meeting as 4:00 PM (UTC) and the
 * browser then re-rendered it as 12:00 PM (EDT) — a React #418 hydration mismatch, and, for
 * a crawler or a reader before hydration, a meeting time wrong by four or five hours on the
 * page that discharges the Commission's 48-hour OPMA notice.
 *
 * And a meeting happens where it happens. A resident reading this page from another state
 * needs the time the doors actually open in Edison, not that instant translated into their
 * own zone, which is what an unpinned formatter would give them.
 *
 * @param date - The date to format (can be Date, string, or null/undefined)
 * @param locale - The locale to use for formatting (defaults to 'en-US')
 * @returns Formatted date-time string or empty string if date is invalid
 *
 * @example
 * formatDateTime(new Date('2026-01-22T12:00:00'))
 * // "Wednesday, January 22, 2026 12:00 PM (EST)"
 */
export function formatDateTime(
	date: Date | string | null | undefined,
	locale = "en-US",
): string {
	if (!date) {
		return "";
	}

	const dateObj = typeof date === "string" ? new Date(date) : date;

	if (Number.isNaN(dateObj.getTime())) {
		return "";
	}

	const dateStr = dateObj.toLocaleDateString(locale, {
		day: "numeric",
		month: "long",
		timeZone: COMMISSION_TIME_ZONE,
		weekday: "long",
		year: "numeric",
	});

	const timeStr = dateObj.toLocaleTimeString(locale, {
		hour: "numeric",
		hour12: true,
		minute: "2-digit",
		timeZone: COMMISSION_TIME_ZONE,
	});

	const timeZoneStr = dateObj
		.toLocaleTimeString(locale, {
			timeZone: COMMISSION_TIME_ZONE,
			timeZoneName: "short",
		})
		.split(" ")
		.pop();

	return `${dateStr} ${timeStr} (${timeZoneStr})`;
}

/**
 * Read a date-only value into a Date positioned at **local** midnight.
 *
 * The rest of this module treats a date-only value as UTC midnight, which is right for reading
 * it — `formatDateShort` pins `timeZone: "UTC"` so the day never shifts. A calendar picker is
 * the one consumer that cannot use that convention: `<Calendar selected>` compares against the
 * user's local day, so handing it UTC midnight highlights the *previous* day anywhere west of
 * Greenwich. New Jersey is four or five hours west of it every day of the year.
 *
 * @example
 * // in America/New_York, with a `date` column read as 2026-09-05T00:00:00Z
 * toLocalDateOnly(row.rain_date) // Sat Sep 05 2026 00:00:00 GMT-0400
 */
export function toLocalDateOnly(
	date: Date | string | null | undefined,
): Date | undefined {
	if (!date) {
		return undefined;
	}

	const dateObj = typeof date === "string" ? new Date(date) : date;

	if (Number.isNaN(dateObj.getTime())) {
		return undefined;
	}

	return new Date(
		dateObj.getUTCFullYear(),
		dateObj.getUTCMonth(),
		dateObj.getUTCDate(),
	);
}

/**
 * Write a locally-positioned Date back out as the `YYYY-MM-DD` a `date` column takes.
 *
 * The mirror of {@link toLocalDateOnly}, and the reason it exists: `toISOString().slice(0, 10)`
 * reads the *UTC* day, so a date the user picked in the evening of their own timezone can be
 * stored as the next one.
 */
export function toDateOnlyString(date: Date | null | undefined): string | null {
	if (!date || Number.isNaN(date.getTime())) {
		return null;
	}

	const month = `${date.getMonth() + 1}`.padStart(2, "0");
	const day = `${date.getDate()}`.padStart(2, "0");
	return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Format a **timestamp** as a short local date.
 *
 * `formatDateShort` is for date-only columns and pins UTC deliberately. A `timestamptz` is a real
 * instant, so pinning UTC renders an evening in New Jersey as the following day. Use this one
 * wherever the underlying column carries a time.
 */
export function formatTimestampDateShort(
	date: Date | string | null | undefined,
	locale = "en-US",
): string {
	if (!date) {
		return "";
	}

	const dateObj = typeof date === "string" ? new Date(date) : date;

	if (Number.isNaN(dateObj.getTime())) {
		return "";
	}

	return dateObj.toLocaleDateString(locale);
}
