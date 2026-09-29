/**
 * `pnpm check-bundle`: fails when central's entry closure (the entry chunk plus every chunk it
 * imports statically) holds App code or a table other than `employees`, or outgrows the ceiling
 * in ./budget.json. Reads the membership file a central build writes, so run `pnpm build` first.
 * Decision: #241.
 */
import { existsSync, readFileSync } from "node:fs";
import {
	type BundleMembership,
	checkEntryClosure,
	formatReport,
} from "./entry-closure";
import { BUDGET_FILE, MEMBERSHIP_FILE } from "./paths";

if (!existsSync(MEMBERSHIP_FILE)) {
	console.error(
		`✗ ${MEMBERSHIP_FILE} does not exist. Build central first (pnpm build, or pnpm turbo run build --filter=central).`,
	);
	process.exit(1);
}

const membership = JSON.parse(
	readFileSync(MEMBERSHIP_FILE, "utf8"),
) as BundleMembership;
const budget = JSON.parse(readFileSync(BUDGET_FILE, "utf8")) as {
	entryClosureGzipKB: number;
};

const result = checkEntryClosure(membership, {
	ceilingBytes: budget.entryClosureGzipKB * 1000,
});
const report = formatReport(result);

if (result.violations.length > 0 || result.overCeiling) {
	console.error(report);
	process.exit(1);
}
console.log(report);
