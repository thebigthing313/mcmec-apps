import { describe, expect, it } from "vitest";
import {
	JobPostingsInsertSchema,
	JobPostingsRowSchema,
	JobPostingsUpdateSchema,
} from "./job-postings";

const validRow = {
	content: { type: "doc", content: [] },
	created_at: "2024-01-01T00:00:00Z",
	created_by: "550e8400-e29b-41d4-a716-446655440000",
	id: "550e8400-e29b-41d4-a716-446655440001",
	is_closed: false,
	published_at: "2024-06-01T00:00:00Z",
	title: "Seasonal Field Worker",
	updated_at: "2024-01-01T00:00:00Z",
	updated_by: "550e8400-e29b-41d4-a716-446655440000",
};

describe("JobPostingsRowSchema", () => {
	it("parses a valid row", () => {
		const result = JobPostingsRowSchema.parse(validRow);
		expect(result.title).toBe("Seasonal Field Worker");
		expect(result.is_closed).toBe(false);
		expect(result.published_at).toBeInstanceOf(Date);
		expect(result.created_at).toBeInstanceOf(Date);
	});

	it("parses a row with null published_at (draft)", () => {
		const result = JobPostingsRowSchema.parse({
			...validRow,
			published_at: null,
		});
		expect(result.published_at).toBeNull();
	});

	it("parses a row with null created_by and updated_by", () => {
		const result = JobPostingsRowSchema.parse({
			...validRow,
			created_by: null,
			updated_by: null,
		});
		expect(result.created_by).toBeNull();
		expect(result.updated_by).toBeNull();
	});

	it("rejects a row missing required title", () => {
		expect(() =>
			JobPostingsRowSchema.parse({ ...validRow, title: undefined }),
		).toThrow();
	});

	it("rejects a row with invalid id", () => {
		expect(() =>
			JobPostingsRowSchema.parse({ ...validRow, id: "not-a-uuid" }),
		).toThrow();
	});
});

describe("JobPostingsInsertSchema", () => {
	it("parses valid insert data", () => {
		const result = JobPostingsInsertSchema.parse({
			content: { type: "doc", content: [] },
			title: "New Position",
		});
		expect(result.title).toBe("New Position");
	});

	it("accepts optional fields", () => {
		const result = JobPostingsInsertSchema.parse({
			content: { type: "doc", content: [] },
			is_closed: true,
			published_at: "2024-06-01T00:00:00Z",
			title: "New Position",
		});
		expect(result.is_closed).toBe(true);
		expect(result.published_at).toBeInstanceOf(Date);
	});

	it("accepts null published_at", () => {
		const result = JobPostingsInsertSchema.parse({
			content: { type: "doc", content: [] },
			published_at: null,
			title: "Draft Position",
		});
		expect(result.published_at).toBeNull();
	});

	it("rejects missing title", () => {
		expect(() =>
			JobPostingsInsertSchema.parse({
				content: { type: "doc", content: [] },
			}),
		).toThrow();
	});

	it("accepts missing content (z.any() allows undefined)", () => {
		const result = JobPostingsInsertSchema.parse({
			title: "No content",
		});
		expect(result.title).toBe("No content");
	});
});

describe("JobPostingsUpdateSchema", () => {
	it("accepts partial updates", () => {
		const result = JobPostingsUpdateSchema.parse({ title: "Updated Title" });
		expect(result.title).toBe("Updated Title");
	});

	it("accepts empty object (no updates)", () => {
		const result = JobPostingsUpdateSchema.parse({});
		expect(result).toEqual({});
	});

	it("accepts updating is_closed", () => {
		const result = JobPostingsUpdateSchema.parse({ is_closed: true });
		expect(result.is_closed).toBe(true);
	});

	it("accepts updating published_at to null", () => {
		const result = JobPostingsUpdateSchema.parse({ published_at: null });
		expect(result.published_at).toBeNull();
	});
});
