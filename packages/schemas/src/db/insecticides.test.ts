import { describe, expect, it } from "vitest";
import { InsecticidesRowSchema } from "./insecticides";

const validRow = {
	active_ingredient: "Etofenprox",
	active_ingredient_url: "https://example.com/etofenprox",
	created_at: "2024-01-01T00:00:00Z",
	fact_sheet_url: "https://example.com/fact-sheet.pdf",
	id: "550e8400-e29b-41d4-a716-446655440001",
	label_url: "https://example.com/label.pdf",
	msds_url: "https://example.com/sds.pdf",
	trade_name: "Zenivex E20",
	type_name: "Adulticide",
	updated_at: "2024-01-01T00:00:00Z",
};

describe("InsecticidesRowSchema", () => {
	it("parses a row with a fact sheet", () => {
		const result = InsecticidesRowSchema.parse(validRow);
		expect(result.fact_sheet_url).toBe("https://example.com/fact-sheet.pdf");
	});

	it("parses a row with no fact sheet", () => {
		const result = InsecticidesRowSchema.parse({
			...validRow,
			fact_sheet_url: null,
		});
		expect(result.fact_sheet_url).toBeNull();
	});

	it("rejects a fact sheet that is not a URL", () => {
		expect(() =>
			InsecticidesRowSchema.parse({
				...validRow,
				fact_sheet_url: "fact sheet",
			}),
		).toThrow();
	});

	// An emptied form field is the form's to turn into null; the row never stores "".
	it("rejects an empty fact sheet", () => {
		expect(() =>
			InsecticidesRowSchema.parse({ ...validRow, fact_sheet_url: "" }),
		).toThrow();
	});
});
