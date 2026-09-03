#!/usr/bin/env node
/**
 * `pnpm stage` — rebuild the Railway **staging** environment on demand.
 *
 * ## Why this exists
 *
 * Staging deploys from `develop`, so every merged PR used to rebuild all six services. That is
 * a lot of build minutes and a lot of churn for changes nobody is looking at yet — staging is
 * only interesting when someone is about to browser-test it.
 *
 * So each `railway.json` now carries an `environments.staging` block whose `watchPatterns` list
 * contains exactly one path: `deploy/staging-release.txt`. Railway skips a build when nothing in
 * a service's watch patterns changed, so pushes to `develop` no longer deploy anything. Changing
 * that one file rebuilds every staging service from the latest `develop`.
 *
 * Production is untouched: the override is scoped to the `staging` environment, and `main` still
 * deploys on every merge.
 *
 * ## Why a file rather than an empty commit
 *
 * Railway's own docs are explicit that **empty commits do not trigger a redeploy when watch
 * paths are configured** — the diff is what gets matched. The marker therefore has to change
 * content, which is why this writes a timestamp and the commit it is staging rather than just
 * touching the file.
 *
 * Usage:
 *   pnpm stage                  # commit the marker and push `develop`
 *   pnpm stage --dry-run        # print what would happen, change nothing
 *   pnpm stage -m "why"         # add a note to the commit message and the marker
 */

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const noteFlag = args.findIndex((a) => a === "-m" || a === "--message");
const note = noteFlag !== -1 ? args[noteFlag + 1] : "";

const BRANCH = "develop";
const MARKER = "deploy/staging-release.txt";

/** No shell: `git` is a real executable, and a shell would mangle multi-word args on Windows. */
function git(...gitArgs) {
	return execFileSync("git", gitArgs, {
		encoding: "utf8",
		stdio: ["ignore", "pipe", "pipe"],
	})?.trim();
}

function fail(message, detail) {
	console.error(`\n✗ ${message}`);
	if (detail) console.error(`  ${detail}`);
	process.exit(1);
}

const branch = git("rev-parse", "--abbrev-ref", "HEAD");
if (branch !== BRANCH) {
	fail(
		`Staging deploys from \`${BRANCH}\`, but you are on \`${branch}\`.`,
		`git checkout ${BRANCH}`,
	);
}

// Anything uncommitted would be left behind by the push, so staging would rebuild without it —
// the exact confusion this script is meant to remove.
const dirty = git("status", "--porcelain");
if (dirty) {
	fail(
		"Working tree is not clean.",
		"Commit or stash first — staging builds what is on origin, not what is on your disk.",
	);
}

console.log("· Fetching origin…");
git("fetch", "--quiet", "origin", BRANCH);
const behind = git("rev-list", "--count", `HEAD..origin/${BRANCH}`);
if (behind !== "0") {
	fail(
		`Local \`${BRANCH}\` is ${behind} commit(s) behind origin.`,
		"git pull — otherwise you would stage an older tree than the one on origin.",
	);
}

const sha = git("rev-parse", "--short", "HEAD");
const subject = git("log", "-1", "--pretty=%s");
const stamp = new Date().toISOString();

console.log(`\nStaging \`${BRANCH}\` @ ${sha} — ${subject}`);
console.log(`  marker: ${MARKER}`);
console.log("  rebuilds: api, central, admin, hr, website-management, public");

if (dryRun) {
	console.log("\n--dry-run: nothing written, nothing pushed.");
	process.exit(0);
}

const header = readFileSync(MARKER, "utf8").split("\nreleased:")[0];
writeFileSync(
	MARKER,
	`${header}\nreleased: ${stamp}\ncommit: ${sha} ${subject}\n${note ? `note: ${note}\n` : ""}`,
);

git("add", MARKER);
git(
	"commit",
	"-m",
	note ? `chore: stage ${sha} — ${note}` : `chore: stage ${sha}`,
);
git("push", "origin", BRANCH);

console.log(`\n✓ Pushed. Staging is rebuilding from ${sha}.`);
console.log(
	"  https://railway.com/project/67759d5d-6819-4544-ae68-c24b9ca73973",
);
