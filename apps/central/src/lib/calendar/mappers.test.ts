import { describe, expect, it } from "vitest";
import {
	fromHoliday,
	fromMeeting,
	fromSprayMission,
	fromStaffEvent,
} from "./mappers";

const ID = "11111111-1111-4111-8111-111111111111";

describe("fromStaffEvent", () => {
	const event = {
		description: "Bring last season's trap counts.",
		end_time: "16:00:00",
		ends_on: null,
		id: ID,
		is_cancelled: false,
		location: "Rutgers, Thompson Hall",
		start_time: "08:30:00",
		starts_on: "2026-10-21",
		title: "Mosquito Short Course",
		url: "https://example.org/register",
	};

	it("passes its day through and trims its times to HH:MM", () => {
		expect(fromStaffEvent(event)).toEqual({
			description: "Bring last season's trap counts.",
			endsOn: "2026-10-21",
			endTime: "16:00",
			key: `staffEvent-${ID}`,
			location: "Rutgers, Thompson Hall",
			source: "staffEvent",
			startsOn: "2026-10-21",
			startTime: "08:30",
			status: "normal",
			title: "Mosquito Short Course",
			url: "https://example.org/register",
		});
	});

	it("spans its days and carries no times when all day", () => {
		const item = fromStaffEvent({
			...event,
			end_time: null,
			ends_on: "2026-10-23",
			start_time: null,
		});
		expect(item).toMatchObject({
			endsOn: "2026-10-23",
			startsOn: "2026-10-21",
		});
		expect(item.startTime).toBeUndefined();
		expect(item.endTime).toBeUndefined();
	});

	it("is cancelled when the event is", () => {
		expect(fromStaffEvent({ ...event, is_cancelled: true }).status).toBe(
			"cancelled",
		);
	});

	it("leaves out what the row does not have", () => {
		const item = fromStaffEvent({
			...event,
			description: null,
			location: null,
			url: null,
		});
		expect("description" in item && item.description).toBeFalsy();
		expect(item.location).toBeUndefined();
		expect(item.url).toBeUndefined();
	});
});

describe("fromHoliday", () => {
	it("is a whole day on the observed date, naming the day it falls on", () => {
		expect(
			fromHoliday({
				falls_on: "2026-07-04",
				id: ID,
				name: "Independence Day",
				observed_on: "2026-07-03",
			}),
		).toEqual({
			endsOn: "2026-07-03",
			fallsOn: "2026-07-04",
			key: `holiday-${ID}`,
			source: "holiday",
			startsOn: "2026-07-03",
			status: "normal",
			title: "Independence Day",
		});
	});

	it("has no falls-on date when it falls on the day it is observed", () => {
		expect(
			fromHoliday({
				falls_on: null,
				id: ID,
				name: "Labor Day",
				observed_on: "2026-09-07",
			}).fallsOn,
		).toBeUndefined();
	});
});

describe("fromMeeting", () => {
	const meeting = {
		id: ID,
		is_cancelled: false,
		location: "Headquarters, board room",
		meeting_at: new Date("2026-10-21T23:00:00Z"),
		name: "Regular Meeting",
		notes: null,
	};

	it("lands on the day and time it is held in Edison, with no end time", () => {
		expect(fromMeeting(meeting)).toEqual({
			endsOn: "2026-10-21",
			key: `meeting-${ID}`,
			location: "Headquarters, board room",
			meetingId: ID,
			source: "meeting",
			startsOn: "2026-10-21",
			startTime: "19:00",
			status: "normal",
			title: "Regular Meeting",
		});
	});

	// 7pm in Edison is past midnight UTC in winter; the day must not move forward.
	it("keeps a winter evening on its own day", () => {
		const item = fromMeeting({
			...meeting,
			meeting_at: new Date("2026-12-10T00:00:00Z"),
		});
		expect(item).toMatchObject({ startsOn: "2026-12-09", startTime: "19:00" });
	});

	it("is cancelled when the meeting is, with its notes as the description", () => {
		expect(
			fromMeeting({
				...meeting,
				is_cancelled: true,
				notes: "No quorum.",
			}),
		).toMatchObject({ description: "No quorum.", status: "cancelled" });
	});
});

describe("fromSprayMission", () => {
	// `date` columns sync through the shared parser as UTC midnight.
	const mission = {
		area_description: "Piscataway, Highland Park",
		end_time: "23:00:00",
		id: ID,
		map_url: "https://example.org/map.pdf",
		mission_date: new Date("2026-10-21T00:00:00Z"),
		rain_date: null as Date | null,
		start_time: "19:30:00",
		status: "scheduled" as const,
	};
	const RAIN = new Date("2026-10-22T00:00:00Z");

	const shape = (items: ReturnType<typeof fromSprayMission>) =>
		items.map((i) => [i.startsOn, i.status, i.otherDate, i.key]);

	it("takes its title and location from the area, and its map link", () => {
		expect(fromSprayMission(mission)[0]).toEqual({
			endsOn: "2026-10-21",
			endTime: "23:00",
			key: `sprayMission-${ID}`,
			location: "Piscataway, Highland Park",
			mapUrl: "https://example.org/map.pdf",
			otherDate: undefined,
			source: "sprayMission",
			startsOn: "2026-10-21",
			startTime: "19:30",
			status: "normal",
			title: "Piscataway, Highland Park",
		});
	});

	it.each([
		["scheduled", null],
		["scheduled", RAIN],
	] as const)("%s, rain date %s: the original date, normal", (status, rain) => {
		expect(
			shape(fromSprayMission({ ...mission, rain_date: rain, status })),
		).toEqual([["2026-10-21", "normal", undefined, `sprayMission-${ID}`]]);
	});

	it.each([
		null,
		RAIN,
	])("cancelled, rain date %s: the original date, cancelled", (rain) => {
		expect(
			shape(
				fromSprayMission({ ...mission, rain_date: rain, status: "cancelled" }),
			),
		).toEqual([["2026-10-21", "cancelled", undefined, `sprayMission-${ID}`]]);
	});

	it("delayed with a rain date: the original delayed, and the rain date", () => {
		expect(
			shape(
				fromSprayMission({ ...mission, rain_date: RAIN, status: "delayed" }),
			),
		).toEqual([
			["2026-10-21", "delayed", "2026-10-22", `sprayMission-${ID}`],
			["2026-10-22", "rainDate", "2026-10-21", `sprayMission-${ID}-rain`],
		]);
	});

	it("delayed with no rain date: the original delayed, moved nowhere yet", () => {
		expect(shape(fromSprayMission({ ...mission, status: "delayed" }))).toEqual([
			["2026-10-21", "delayed", undefined, `sprayMission-${ID}`],
		]);
	});

	it("completed with a rain date: the original moved, and completed on the rain date", () => {
		expect(
			shape(
				fromSprayMission({ ...mission, rain_date: RAIN, status: "completed" }),
			),
		).toEqual([
			["2026-10-21", "delayed", "2026-10-22", `sprayMission-${ID}`],
			["2026-10-22", "completed", "2026-10-21", `sprayMission-${ID}-rain`],
		]);
	});

	it("completed with no rain date: the original date, completed", () => {
		expect(
			shape(fromSprayMission({ ...mission, status: "completed" })),
		).toEqual([["2026-10-21", "completed", undefined, `sprayMission-${ID}`]]);
	});
});
