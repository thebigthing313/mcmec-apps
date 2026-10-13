import { describe, expect, it } from "vitest";
import { HolidaysRowSchema } from "./holidays";

const validRow = {
	created_at: "2026-01-01T00:00:00Z",
	falls_on: "2026-07-04",
	id: "550e8400-e29b-41d4-a716-446655440001",
	name: "Independence Day",
	observed_on: "2026-07-03",
	updated_at: "2026-01-01T00:00:00Z",
};

describe("HolidaysRowSchema", () => {
	// The point of the schema: a date column stays the day it names, never a UTC-midnight Date.
	it("keeps both dates as the strings they arrived as", () => {
		const result = HolidaysRowSchema.parse(validRow);
		expect(result.observed_on).toBe("2026-07-03");
		expect(result.falls_on).toBe("2026-07-04");
	});

	it("allows a Holiday that falls on the day it is observed", () => {
		const result = HolidaysRowSchema.parse({ ...validRow, falls_on: null });
		expect(result.falls_on).toBeNull();
	});

	it.each([
		["a Date", new Date("2026-07-03")],
		["a timestamp", "2026-07-03T00:00:00Z"],
		["a US-style date", "7/3/2026"],
		["an impossible day", "2026-02-30"],
		["an empty string", ""],
	])("refuses an observed date that is %s", (_label, observed_on) => {
		expect(() =>
			HolidaysRowSchema.parse({ ...validRow, observed_on }),
		).toThrow();
	});

	it("refuses a falls-on date that is not a day", () => {
		expect(() =>
			HolidaysRowSchema.parse({ ...validRow, falls_on: "July 4" }),
		).toThrow();
	});

	it("refuses an unnamed Holiday", () => {
		expect(() => HolidaysRowSchema.parse({ ...validRow, name: "" })).toThrow();
	});
});
