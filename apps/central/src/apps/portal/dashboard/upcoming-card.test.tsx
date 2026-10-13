// @vitest-environment happy-dom
/**
 * The Upcoming card's body: what each row says, how a cancelled one looks, and that it never
 * says "Nothing scheduled." while its tables are still syncing.
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { CalendarItem } from "@/src/lib/calendar/items";
import { UpcomingList } from "./upcoming-card";

afterEach(cleanup);

// A Tuesday.
const TODAY = "2026-10-13";

function item(
	overrides: Partial<CalendarItem> & { key: string },
): CalendarItem {
	return {
		endsOn: overrides.startsOn ?? TODAY,
		source: "staffEvent",
		startsOn: TODAY,
		status: "normal",
		title: overrides.key,
		...overrides,
	};
}

const PAST = item({
	key: "past",
	startsOn: "2026-10-01",
	title: "Already over",
});

const ITEMS: CalendarItem[] = [
	PAST,
	item({
		key: "meeting",
		source: "meeting",
		startsOn: "2026-10-14",
		startTime: "19:00",
		title: "Regular Meeting",
	}),
	item({
		description: "Bring your card.",
		key: "course",
		startsOn: "2026-10-15",
		title: "Recertification course",
	}),
	item({
		key: "cancelled",
		source: "meeting",
		startsOn: "2026-10-21",
		startTime: "19:00",
		status: "cancelled",
		title: "Special Meeting",
	}),
];

const row = (title: string) => {
	const button = screen.getByText(title).closest("button");
	if (!button) throw new Error(`no row for ${title}`);
	return button;
};

describe("UpcomingList", () => {
	it("lists what has not ended, in an ordered list, saying when relative to today", () => {
		render(<UpcomingList isReady items={ITEMS} today={TODAY} />);

		expect(screen.getAllByRole("listitem")).toHaveLength(3);
		expect(screen.queryByText("Already over")).toBeNull();
		expect(row("Regular Meeting").textContent).toContain("Tomorrow · 7pm");
		expect(row("Recertification course").textContent).toContain(
			"Thursday · All day",
		);
		expect(row("Special Meeting").textContent).toContain("Wed, Oct 21 · 7pm");
	});

	it("shows each row's date tile and names the row's button in words", () => {
		render(<UpcomingList isReady items={ITEMS} today={TODAY} />);

		const meeting = row("Regular Meeting");
		expect(meeting.textContent).toContain("Oct14");
		expect(meeting.getAttribute("aria-label")).toBe(
			"Meeting: Regular Meeting, Wednesday, October 14, 2026, 7pm",
		);
	});

	it("greys and strikes through a cancelled row, and badges it", () => {
		render(<UpcomingList isReady items={ITEMS} today={TODAY} />);

		const cancelled = row("Special Meeting");
		expect(cancelled.className).toContain("text-muted-foreground");
		expect(screen.getByText("Special Meeting").className).toContain(
			"line-through",
		);
		expect(cancelled.textContent).toContain("Cancelled");
		expect(screen.getByText("Regular Meeting").className).not.toContain(
			"line-through",
		);
	});

	it("lists an item already under way as today's", () => {
		render(
			<UpcomingList
				isReady
				items={[
					item({
						endsOn: "2026-10-14",
						key: "training",
						startsOn: "2026-10-12",
						title: "Field training",
					}),
				]}
				today={TODAY}
			/>,
		);

		expect(row("Field training").textContent).toContain("Oct13");
		expect(row("Field training").textContent).toContain("Today · ");
	});

	it("caps the list at five", () => {
		const many = Array.from({ length: 7 }, (_, i) =>
			item({ key: `item-${i}`, startsOn: `2026-10-2${i}` }),
		);
		render(<UpcomingList isReady items={many} today={TODAY} />);

		expect(screen.getAllByRole("listitem")).toHaveLength(5);
	});

	it("opens an item's details from its row", () => {
		render(<UpcomingList isReady items={ITEMS} today={TODAY} />);

		fireEvent.click(row("Recertification course"));

		expect(screen.getByText("Bring your card.")).toBeTruthy();
	});

	it("says so when nothing is coming up", () => {
		render(<UpcomingList isReady items={[PAST]} today={TODAY} />);

		expect(screen.getByText("Nothing scheduled.")).toBeTruthy();
		expect(screen.queryByRole("list")).toBeNull();
	});

	it("shows a loading state, never the empty one, while syncing", () => {
		render(<UpcomingList isReady={false} items={[]} today={TODAY} />);

		expect(screen.getByRole("status").textContent).toContain("Loading");
		expect(screen.queryByText("Nothing scheduled.")).toBeNull();
	});
});
