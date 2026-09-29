/**
 * `shapePathFor` and `electricParser` are kept twice on purpose (#239): once here in central,
 * once in `apps/public/src/lib/electric-shape.ts`. This pins both copies to the same known
 * answers, so drift fails here rather than as a 404 or as dates arriving as strings.
 *
 * Reaching into `apps/public` by relative path is deliberate and confined to this test: public
 * has no test runner, and a shared package is exactly what #239 decided these lines don't need.
 */
import { describe, expect, it } from "vitest";
import * as publicShape from "../../../../public/src/lib/electric-shape";
import * as centralShape from "./electric-collection";

const twins = [
	["central", centralShape],
	["public", publicShape],
] as const;

describe.each(twins)("%s's shape helpers", (_name, shape) => {
	it("points a table at the api's shape proxy", () => {
		expect(shape.shapePathFor("notices")).toBe("/api/shapes/notices");
	});

	it("coerces dates, timestamps and numerics", () => {
		const { electricParser } = shape;
		expect(electricParser.date("2026-09-29")).toEqual(
			new Date("2026-09-29T00:00:00.000Z"),
		);
		expect(electricParser.timestamp("2026-09-29T12:30:00")).toBeInstanceOf(
			Date,
		);
		expect(
			electricParser.timestamptz("2026-09-29T12:30:00+00:00").toISOString(),
		).toBe("2026-09-29T12:30:00.000Z");
		expect(electricParser.numeric("1.25")).toBe(1.25);
	});

	it("coerces nothing else", () => {
		expect(Object.keys(shape.electricParser).sort()).toEqual([
			"date",
			"numeric",
			"timestamp",
			"timestamptz",
		]);
	});
});
