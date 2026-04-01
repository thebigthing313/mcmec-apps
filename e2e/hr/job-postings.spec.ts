import { expect, test } from "@playwright/test";

test.describe("Job Postings - HR App", () => {
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

	test("can edit a job posting", async ({ page }) => {
		await page.goto("/job-postings");
		await page.getByText("Seasonal Field Worker").click();
		await page.getByRole("link", { name: /edit/i }).click();

		// Toggle is_closed
		await page.getByRole("switch").click();
		await page.getByRole("button", { name: /update/i }).click();

		// Should navigate back to detail and show closed status
		await expect(page.getByText("Closed")).toBeVisible();
	});
});
