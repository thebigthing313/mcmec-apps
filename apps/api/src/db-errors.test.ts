import { DrizzleQueryError } from "drizzle-orm/errors";
import { describe, expect, it } from "vitest";
import { pgErrorCode, pgErrorConstraint } from "./db-errors";

describe("pgErrorCode", () => {
	it("reads a bare pg error", () => {
		expect(
			pgErrorCode(Object.assign(new Error("dup"), { code: "23505" })),
		).toBe("23505");
	});

	// What a handler actually catches: Drizzle wraps the pg error as `cause`.
	it("reads through Drizzle's query wrapper", () => {
		const pg = Object.assign(new Error("fk"), { code: "23503" });
		expect(pgErrorCode(new DrizzleQueryError("delete …", [], pg))).toBe(
			"23503",
		);
	});

	it("finds nothing on an error that is not from Postgres", () => {
		expect(pgErrorCode(new Error("boom"))).toBeUndefined();
		expect(pgErrorCode("boom")).toBeUndefined();
	});

	it("reads the constraint a violation names", () => {
		const pg = Object.assign(new Error("dup"), {
			code: "23505",
			constraint: "holidays_observed_on_unique",
		});
		expect(pgErrorConstraint(new DrizzleQueryError("insert …", [], pg))).toBe(
			"holidays_observed_on_unique",
		);
	});
});
