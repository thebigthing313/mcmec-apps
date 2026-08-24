import { expect, test } from "@playwright/test";

test.describe("Job Postings - Website Management App", () => {
	test("job postings list page loads with seed data", async ({ page }) => {
		await page.goto("/job-postings");
		await expect(
			page.getByRole("heading", { name: "Job Postings" }),
		).toBeVisible();
		// Seed data includes multiple postings
		await expect(page.getByText("Seasonal Field Worker")).toBeVisible();
		await expect(page.getByText("Lab Technician")).toBeVisible();
	});

	test("shows correct status badges from seed data", async ({ page }) => {
		await page.goto("/job-postings");
		// Published postings, closed posting, and draft posting exist in seed
		await expect(page.getByText("Published").first()).toBeVisible();
		await expect(page.getByText("Closed")).toBeVisible();
		await expect(page.getByText("Draft")).toBeVisible();
	});

	test("can view job posting detail", async ({ page }) => {
		await page.goto("/job-postings");
		await page.getByText("Seasonal Field Worker").click();
		await expect(
			page.getByRole("heading", { name: "Seasonal Field Worker" }),
		).toBeVisible();
		// Content from seed data rendered via TipTap
		await expect(page.getByText("Valid NJ driver license")).toBeVisible();
	});

	test("can navigate to create page", async ({ page }) => {
		await page.goto("/job-postings");
		await page.getByRole("link", { name: /add job posting/i }).click();
		await expect(page.getByText("New Job Posting")).toBeVisible();
	});

	test("can create a new job posting", async ({ page }) => {
		await page.goto("/job-postings/new");

		await page.getByLabel("Title").fill("E2E Test Position");
		await page.getByRole("button", { name: /create/i }).click();

		// Should navigate to the detail page
		await expect(
			page.getByRole("heading", { name: "E2E Test Position" }),
		).toBeVisible();
		await expect(page.getByText("Draft")).toBeVisible();
	});

	test("can edit a job posting's details", async ({ page }) => {
		await page.goto("/job-postings");
		await page.getByText("Seasonal Field Worker").click();
		await page.getByRole("link", { name: /edit/i }).click();

		await page.getByLabel("Title").fill("Seasonal Field Worker (2026)");
		await page.getByRole("button", { name: /update/i }).click();

		await expect(
			page.getByRole("heading", { name: "Seasonal Field Worker (2026)" }),
		).toBeVisible();
	});

	// Closing is a named command now, not a switch inside the edit form: the button posts
	// `website.closeJobPosting` and the status badge follows the optimistic update.
	test("can close and reopen a job posting", async ({ page }) => {
		await page.goto("/job-postings");
		await page.getByText("Lab Technician").click();
		await page.getByRole("link", { name: /edit/i }).click();

		await page.getByRole("button", { name: "Close", exact: true }).click();
		await expect(page.getByRole("button", { name: "Reopen" })).toBeVisible();

		await page.getByRole("button", { name: "Reopen" }).click();
		await expect(
			page.getByRole("button", { name: "Close", exact: true }),
		).toBeVisible();
	});

	// `published_at` is server-stamped, so publishing is an action rather than a date entry.
	test("can publish a draft job posting", async ({ page }) => {
		await page.goto("/job-postings/new");
		await page.getByLabel("Title").fill("E2E Publish Target");
		await page.getByRole("button", { name: /create/i }).click();
		await expect(page.getByText("Draft")).toBeVisible();

		await page.getByRole("link", { name: /edit/i }).click();
		await page.getByRole("button", { name: "Publish" }).click();
		await expect(page.getByRole("button", { name: "Unpublish" })).toBeVisible();
	});
});
