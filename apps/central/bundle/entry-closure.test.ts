import { describe, expect, it } from "vitest";
import {
	type BundleMembership,
	type ChunkMembership,
	checkEntryClosure,
	formatReport,
	toRepoPath,
} from "./entry-closure";

describe("toRepoPath", () => {
	it("makes a Windows module id repo-relative with forward slashes", () => {
		expect(
			toRepoPath(
				"F:\\mcmec-apps\\apps\\central\\src\\apps\\hr\\gate.ts",
				"F:\\mcmec-apps",
			),
		).toBe("apps/central/src/apps/hr/gate.ts");
	});

	it("handles a POSIX root and drops a query suffix", () => {
		expect(
			toRepoPath(
				"/home/runner/work/mcmec-apps/packages/ui/src/blocks/record-index.tsx?v=1",
				"/home/runner/work/mcmec-apps",
			),
		).toBe("packages/ui/src/blocks/record-index.tsx");
	});

	it("maps a virtual wrapper of a repo file to that file, so the rule still sees it", () => {
		expect(
			toRepoPath(
				"\0F:/mcmec-apps/apps/central/src/apps/hr/legacy.js?commonjs-module",
				"F:\\mcmec-apps",
			),
		).toBe("apps/central/src/apps/hr/legacy.js");
	});

	it("leaves a purely virtual module as it is", () => {
		expect(
			toRepoPath("\0vite/modulepreload-polyfill.js", "/home/runner/work/x"),
		).toBe("\0vite/modulepreload-polyfill.js");
	});
});

function chunk(
	fileName: string,
	overrides: Partial<Omit<ChunkMembership, "fileName">> = {},
): ChunkMembership {
	return {
		dynamicImports: [],
		fileName,
		gzipBytes: 1_000,
		imports: [],
		isEntry: false,
		modules: [],
		...overrides,
	};
}

function mod(id: string, renderedLength = 100) {
	return { id, renderedLength };
}

const CEILING = 1_000_000;

describe("checkEntryClosure", () => {
	it("refuses an App module in the entry chunk", () => {
		const membership: BundleMembership = {
			chunks: [
				chunk("assets/index.js", {
					isEntry: true,
					modules: [
						mod("apps/central/src/main.tsx"),
						mod("apps/central/src/apps/hr/employees-table.tsx"),
					],
				}),
			],
		};

		const result = checkEntryClosure(membership, { ceilingBytes: CEILING });

		expect(result.violations).toEqual([
			expect.objectContaining({
				chunk: "assets/index.js",
				module: "apps/central/src/apps/hr/employees-table.tsx",
			}),
		]);
	});

	it("follows static imports transitively and names the chain that brought the module in", () => {
		const membership: BundleMembership = {
			chunks: [
				chunk("assets/index.js", {
					imports: ["assets/vendor.js"],
					isEntry: true,
					modules: [mod("apps/central/src/main.tsx")],
				}),
				chunk("assets/vendor.js", {
					imports: ["assets/hr.js"],
					modules: [mod("node_modules/react/index.js")],
				}),
				chunk("assets/hr.js", {
					modules: [mod("apps/central/src/apps/hr/gate.ts")],
				}),
			],
		};

		const result = checkEntryClosure(membership, { ceilingBytes: CEILING });

		expect(result.violations).toEqual([
			{
				chunk: "assets/hr.js",
				module: "apps/central/src/apps/hr/gate.ts",
				reason: expect.any(String),
				via: ["assets/index.js", "assets/vendor.js", "assets/hr.js"],
			},
		]);
	});

	it("refuses every registry table but employees", () => {
		const membership: BundleMembership = {
			chunks: [
				chunk("assets/index.js", {
					isEntry: true,
					modules: [
						mod("apps/central/src/lib/collections/index.ts"),
						mod("apps/central/src/lib/collections/registry.ts"),
						mod("apps/central/src/lib/collections/tables/employees.ts"),
						mod("apps/central/src/lib/collections/tables/notices.ts"),
						mod("apps/central/src/lib/collections/tables/notice-types.ts"),
					],
				}),
			],
		};

		const result = checkEntryClosure(membership, { ceilingBytes: CEILING });

		expect(result.violations.map((v) => v.module)).toEqual([
			"apps/central/src/lib/collections/tables/notices.ts",
			"apps/central/src/lib/collections/tables/notice-types.ts",
		]);
	});

	it("refuses a table defined as a folder, not only as a single file", () => {
		const membership: BundleMembership = {
			chunks: [
				chunk("assets/index.js", {
					isEntry: true,
					modules: [
						mod("apps/central/src/lib/collections/tables/employees/index.ts"),
						mod(
							"apps/central/src/lib/collections/tables/insecticides/index.ts",
						),
					],
				}),
			],
		};

		const result = checkEntryClosure(membership, { ceilingBytes: CEILING });

		expect(result.violations.map((v) => v.module)).toEqual([
			"apps/central/src/lib/collections/tables/insecticides/index.ts",
		]);
	});

	it("ignores a module Rollup kept none of, since it ships no code", () => {
		const membership: BundleMembership = {
			chunks: [
				chunk("assets/index.js", {
					isEntry: true,
					modules: [mod("apps/central/src/apps/hr/constants.ts", 0)],
				}),
			],
		};

		const result = checkEntryClosure(membership, { ceilingBytes: CEILING });

		expect(result.violations).toEqual([]);
	});

	it("refuses a ceiling that is not a positive number rather than passing everything", () => {
		const membership: BundleMembership = {
			chunks: [chunk("assets/index.js", { isEntry: true })],
		};

		expect(() =>
			checkEntryClosure(membership, { ceilingBytes: Number.NaN }),
		).toThrow(/ceiling/);
		expect(() => checkEntryClosure(membership, { ceilingBytes: 0 })).toThrow(
			/ceiling/,
		);
	});

	it("allows routes, the shell and the shared packages", () => {
		const membership: BundleMembership = {
			chunks: [
				chunk("assets/index.js", {
					isEntry: true,
					modules: [
						mod("apps/central/src/main.tsx"),
						mod("apps/central/src/routeTree.gen.ts"),
						mod("apps/central/src/routes/(app)/notices/index.tsx"),
						mod("apps/central/src/lib/gates.ts"),
						mod("packages/ui/src/blocks/record-index.tsx"),
						mod("packages/lib/src/constants/assets.ts"),
						mod("packages/schemas/src/db/employees.ts"),
						mod("packages/auth/src/client.ts"),
						mod(
							"node_modules/.pnpm/zod@4.3.5/node_modules/zod/v4/classic/schemas.js",
						),
						mod("\0vite/modulepreload-polyfill.js"),
					],
				}),
			],
		};

		const result = checkEntryClosure(membership, { ceilingBytes: CEILING });

		expect(result.violations).toEqual([]);
	});

	describe("the ceiling", () => {
		const membership: BundleMembership = {
			chunks: [
				chunk("assets/index.js", {
					dynamicImports: ["assets/lazy.js"],
					gzipBytes: 200_000,
					imports: ["assets/shared.js"],
					isEntry: true,
				}),
				chunk("assets/shared.js", { gzipBytes: 50_000 }),
				chunk("assets/lazy.js", { gzipBytes: 900_000 }),
			],
		};

		it("sums the gzip size of the entry closure only", () => {
			const result = checkEntryClosure(membership, { ceilingBytes: 250_000 });

			expect(result.gzipBytes).toBe(250_000);
			expect(result.overCeiling).toBe(false);
		});

		it("fails a closure one byte over", () => {
			const result = checkEntryClosure(membership, { ceilingBytes: 249_999 });

			expect(result.overCeiling).toBe(true);
		});
	});

	it("refuses membership with no entry chunk rather than passing an empty closure", () => {
		expect(() =>
			checkEntryClosure(
				{ chunks: [chunk("assets/a.js")] },
				{ ceilingBytes: CEILING },
			),
		).toThrow(/no entry chunk/);
	});

	it("leaves out chunks reached only by a dynamic import", () => {
		const membership: BundleMembership = {
			chunks: [
				chunk("assets/index.js", {
					dynamicImports: ["assets/hr.js"],
					isEntry: true,
					modules: [mod("apps/central/src/main.tsx")],
				}),
				chunk("assets/hr.js", {
					modules: [mod("apps/central/src/apps/hr/employees-table.tsx")],
				}),
			],
		};

		const result = checkEntryClosure(membership, { ceilingBytes: CEILING });

		expect(result.violations).toEqual([]);
		expect(result.closure.map((c) => c.fileName)).toEqual(["assets/index.js"]);
	});
});

describe("formatReport", () => {
	const membership: BundleMembership = {
		chunks: [
			chunk("assets/index-a1.js", {
				gzipBytes: 120_400,
				imports: ["assets/route-b2.js"],
				isEntry: true,
			}),
			chunk("assets/route-b2.js", {
				gzipBytes: 3_100,
				modules: [mod("apps/central/src/apps/hr/employees-table.tsx")],
			}),
		],
	};

	it("names the offending module, why, and the chunks that brought it in", () => {
		const report = formatReport(
			checkEntryClosure(membership, { ceilingBytes: 200_000 }),
		);

		expect(report).toContain("apps/central/src/apps/hr/employees-table.tsx");
		expect(report).toContain("App code");
		expect(report).toContain("assets/index-a1.js -> assets/route-b2.js");
	});

	it("gives the closure size against the ceiling in kB", () => {
		const report = formatReport(
			checkEntryClosure(membership, { ceilingBytes: 120_000 }),
		);

		expect(report).toContain("123.5 kB gzip");
		expect(report).toContain("ceiling 120.0 kB");
	});
});
