import { describe, expect, it } from "vitest";
import { StaffEventsRowSchema } from "./staff-events";

const validRow = {
	created_at: "2026-01-01T00:00:00Z",
	description: "Hosted by the State Mosquito Control Commission.",
	end_time: "15:00:00",
	ends_on: null,
	id: "550e8400-e29b-41d4-a716-446655440001",
	is_cancelled: false,
	location: null,
	start_time: "13:00:00",
	starts_on: "2026-10-21",
	title: "Pesticide recertification webinar",
	updated_at: "2026-01-01T00:00:00Z",
	url: "https://example.com/register",
};

const issuesOn = (row: Record<string, unknown>) => {
	const result = StaffEventsRowSchema.safeParse({ ...validRow, ...row });
	return result.success ? [] : result.error.issues.map((i) => i.path[0]);
};

describe("StaffEventsRowSchema", () => {
	it("keeps the days as the strings they arrived as", () => {
		const row = StaffEventsRowSchema.parse({
			...validRow,
			ends_on: "2026-10-23",
		});
		expect(row.starts_on).toBe("2026-10-21");
		expect(row.ends_on).toBe("2026-10-23");
	});

	it("allows an all-day event with no times", () => {
		expect(issuesOn({ end_time: null, start_time: null })).toEqual([]);
	});

	it("allows a start time with no end time", () => {
		expect(issuesOn({ end_time: null })).toEqual([]);
	});

	it("refuses a day that is not a day", () => {
		expect(issuesOn({ starts_on: "2026-10-21T13:00:00Z" })).toEqual([
			"starts_on",
		]);
	});

	it("refuses a link that is not a URL", () => {
		expect(issuesOn({ url: "register here" })).toEqual(["url"]);
	});

	describe("the end date", () => {
		it("may be the start date or later", () => {
			expect(issuesOn({ ends_on: "2026-10-21" })).toEqual([]);
			expect(issuesOn({ ends_on: "2026-10-22" })).toEqual([]);
		});

		it("can't be before the start date", () => {
			expect(issuesOn({ ends_on: "2026-10-20" })).toEqual(["ends_on"]);
		});
	});

	describe("the end time", () => {
		it("needs a start time", () => {
			expect(issuesOn({ start_time: null })).toEqual(["end_time"]);
		});

		it("must follow the start time on a single day", () => {
			expect(issuesOn({ end_time: "13:00:00" })).toEqual(["end_time"]);
			expect(issuesOn({ end_time: "12:00" })).toEqual(["end_time"]);
		});

		it("compares 17:00 and 17:00:00 as the same time", () => {
			expect(issuesOn({ end_time: "13:00", start_time: "13:00:00" })).toEqual([
				"end_time",
			]);
		});

		it("may be earlier than the start time across days", () => {
			expect(
				issuesOn({
					end_time: "09:00:00",
					ends_on: "2026-10-22",
					start_time: "17:00:00",
				}),
			).toEqual([]);
		});
	});
});
