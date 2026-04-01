import { getJobPostingStatus } from "@mcmec/lib/functions/job-posting-status";
import { describe, expect, it } from "vitest";

describe("getJobPostingStatus", () => {
	it("returns 'closed' when is_closed is true regardless of published_at", () => {
		expect(getJobPostingStatus({ is_closed: true, published_at: null })).toBe(
			"closed",
		);
		expect(
			getJobPostingStatus({
				is_closed: true,
				published_at: new Date("2020-01-01"),
			}),
		).toBe("closed");
		expect(
			getJobPostingStatus({
				is_closed: true,
				published_at: new Date("2099-01-01"),
			}),
		).toBe("closed");
	});

	it("returns 'draft' when published_at is null and not closed", () => {
		expect(getJobPostingStatus({ is_closed: false, published_at: null })).toBe(
			"draft",
		);
	});

	it("returns 'pending' when published_at is in the future", () => {
		const futureDate = new Date();
		futureDate.setFullYear(futureDate.getFullYear() + 1);
		expect(
			getJobPostingStatus({ is_closed: false, published_at: futureDate }),
		).toBe("pending");
	});

	it("returns 'published' when published_at is in the past", () => {
		const pastDate = new Date("2020-01-01");
		expect(
			getJobPostingStatus({ is_closed: false, published_at: pastDate }),
		).toBe("published");
	});

	it("returns 'published' when published_at is exactly now", () => {
		const now = new Date();
		expect(getJobPostingStatus({ is_closed: false, published_at: now })).toBe(
			"published",
		);
	});
});
