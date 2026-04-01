import { expect, test } from "@playwright/test";

test.describe("Job Opportunities - Public Site", () => {
	test("listing page loads and shows published postings", async ({ page }) => {
		await page.goto("/about/job-opportunities");
		await expect(
			page.getByRole("heading", { name: "Job Opportunities" }),
		).toBeVisible();
		// Seed data has two published postings visible to public
		await expect(page.getByText("Seasonal Field Worker")).toBeVisible();
		await expect(page.getByText("Lab Technician")).toBeVisible();
	});

	test("does not show closed or draft postings", async ({ page }) => {
		await page.goto("/about/job-opportunities");
		// Closed posting should not appear
		await expect(page.getByText("Equipment Mechanic")).not.toBeVisible();
		// Draft posting should not appear
		await expect(page.getByText("Summer Intern")).not.toBeVisible();
	});

	test("can view posting detail page", async ({ page }) => {
		await page.goto("/about/job-opportunities");
		await page.getByText("Seasonal Field Worker").click();
		await expect(
			page.getByRole("heading", { name: "Seasonal Field Worker" }),
		).toBeVisible();
		// TipTap content rendered
		await expect(page.getByText("Valid NJ driver license")).toBeVisible();
	});

	test("non-existent posting shows not found", async ({ page }) => {
		await page.goto(
			"/about/job-opportunities/00000000-0000-0000-0000-000000000000",
		);
		await expect(page.getByText(/not found/i)).toBeVisible();
	});

	test("closed posting is not accessible via direct URL", async ({ page }) => {
		// Closed posting ID from seed data
		await page.goto(
			"/about/job-opportunities/a1b2c3d4-0000-0000-0000-000000000003",
		);
		await expect(page.getByText(/not found/i)).toBeVisible();
	});

	test("job opportunities link exists in navbar", async ({ page }) => {
		await page.goto("/");
		const aboutTrigger = page.getByRole("button", { name: /about/i });
		if (await aboutTrigger.isVisible()) {
			await aboutTrigger.click();
			await expect(
				page.getByRole("link", { name: /job opportunities/i }),
			).toBeVisible();
		}
	});
});
