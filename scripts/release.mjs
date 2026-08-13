#!/usr/bin/env node
/**
 * `pnpm release` — cut a release from `develop` to `main`.
 *
 * Consumes the pending changesets (bumping versions and writing CHANGELOGs), commits the
 * result, and opens the promotion PR.
 *
 * ## Why the version commit lands on `develop`
 *
 * The `main` ruleset has **no bypass actors**, so nothing can push a commit onto it directly —
 * not a person, not CI. The promotion PR's head branch is `develop`, which means "a commit in
 * the release PR" and "a commit on `develop`" are the same thing. So versioning cannot be a bot
 * that amends the PR; it has to happen here, before the PR is opened. This is what the old
 * `chore: version packages` commits were, done by hand.
 *
 * Pushing straight to `develop` works because that ruleset grants the Admin role an `always`
 * bypass. If you are not an admin, this script's push will be rejected — cut a branch, PR it
 * into `develop`, then re-run.
 *
 * ## Why this cannot work without the matching CI change
 *
 * `Changeset Check` used to run `changeset status --since=origin/main` on release PRs too. Once
 * the changesets here are consumed there are none left, but the packages have still changed, so
 * that command exits 1 — the check went green when you forgot to version and red when you did
 * it properly. `.github/workflows/changeset-check.yml` now asserts the opposite on PRs into
 * `main`: that nothing is left unconsumed.
 *
 * Usage:
 *   pnpm release                      # plan, confirm, version, push, open the PR
 *   pnpm release --dry-run            # print the plan and stop, changing nothing
 *   pnpm release --yes                # skip the confirmation prompt
 *   pnpm release --title "release: …" # override the PR title
 */

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { createInterface } from "node:readline/promises";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const assumeYes = args.includes("--yes");
const titleFlag = args.indexOf("--title");
const prTitle =
	titleFlag !== -1 && args[titleFlag + 1]
		? args[titleFlag + 1]
		: "release: version packages";

const RELEASE_BRANCH = "develop";
const TARGET_BRANCH = "main";
// Written into the repo root because changesets resolves `--output` relative to cwd, not as an
// absolute path. Removed in a finally, so a crash mid-run cannot leave it behind.
const STATUS_FILE = "changeset-status.tmp.json";

/**
 * Run a command, returning trimmed stdout. Throws with the child's stderr attached.
 *
 * `shell` is off by default, and that default is load-bearing. `execFileSync` with a shell
 * *joins* arguments rather than escaping them, so on Windows anything containing a space or a
 * newline is torn apart — the multi-line PR body arrives at `gh` as its first word, and a title
 * with spaces loses everything after the first. `git` and `gh` are real executables and need no
 * shell, so they get none.
 */
function run(cmd, cmdArgs, { capture = true, shell = false } = {}) {
	return execFileSync(cmd, cmdArgs, {
		encoding: "utf8",
		stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
		shell,
	})?.trim();
}

/**
 * pnpm is the one command here that does need a shell on Windows: it is a `.cmd` shim, which
 * `spawnSync` cannot execute directly (ENOENT). Safe because every argument passed to it below
 * is a single bare token.
 */
function pnpm(pnpmArgs, options = {}) {
	return run("pnpm", pnpmArgs, {
		...options,
		shell: process.platform === "win32",
	});
}

function git(...gitArgs) {
	return run("git", gitArgs);
}

function fail(message, detail) {
	console.error(`\n✗ ${message}`);
	if (detail) console.error(`  ${detail}`);
	process.exit(1);
}

/**
 * Everything that must be true before we touch anything. Each is a separate check so the
 * failure message names the actual problem rather than "preconditions not met".
 */
function preflight() {
	const branch = git("rev-parse", "--abbrev-ref", "HEAD");
	if (branch !== RELEASE_BRANCH) {
		fail(
			`Releases are cut from \`${RELEASE_BRANCH}\`, but you are on \`${branch}\`.`,
			`git checkout ${RELEASE_BRANCH}`,
		);
	}

	if (git("status", "--porcelain")) {
		fail(
			"Working tree is not clean.",
			"Commit or stash your changes — this script commits everything it produces.",
		);
	}

	console.log("· Fetching origin…");
	run("git", ["fetch", "--quiet", "origin", RELEASE_BRANCH, TARGET_BRANCH]);

	const local = git("rev-parse", "HEAD");
	const remote = git("rev-parse", `origin/${RELEASE_BRANCH}`);
	if (local !== remote) {
		const ahead = git("rev-list", "--count", `origin/${RELEASE_BRANCH}..HEAD`);
		const behind = git("rev-list", "--count", `HEAD..origin/${RELEASE_BRANCH}`);
		fail(
			`Local \`${RELEASE_BRANCH}\` is out of sync with origin (${ahead} ahead, ${behind} behind).`,
			"Push or pull first — the release must be cut from exactly what is on origin.",
		);
	}

	const unreleased = git(
		"rev-list",
		"--count",
		`origin/${TARGET_BRANCH}..origin/${RELEASE_BRANCH}`,
	);
	if (unreleased === "0") {
		fail(
			`\`${RELEASE_BRANCH}\` has nothing that \`${TARGET_BRANCH}\` does not already have.`,
		);
	}

	return { unreleased };
}

/**
 * Ask changesets what it would do, in JSON.
 *
 * `changeset status` exits 1 in two very different situations: packages changed with no
 * changesets to cover them, and genuine failure. Both are worth stopping on, but the first is
 * the common one and deserves a message that says what to do about it.
 */
function readPlan() {
	try {
		pnpm(["changeset", "status", `--output=${STATUS_FILE}`]);
	} catch (error) {
		const output = `${error.stdout ?? ""}${error.stderr ?? ""}`;
		if (output.includes("no changesets were found")) {
			fail(
				"Some packages have changed but carry no changeset.",
				"Run `pnpm change` to describe them, or `pnpm change --empty` if they need no release.",
			);
		}
		fail("`changeset status` failed.", output.trim());
	}

	const plan = JSON.parse(readFileSync(STATUS_FILE, "utf8"));
	// Deleted the moment it has been read, not merely in the outer `finally`. The commit below
	// stages with `git add -A`, which runs long before that finally does — so a file left lying
	// here goes into the release commit. It did, once.
	rmSync(STATUS_FILE, { force: true });

	if (!plan.releases?.length) {
		fail("There are no pending changesets to consume.");
	}
	return plan;
}

function printPlan(plan, unreleased) {
	const order = { major: 0, minor: 1, patch: 2 };
	const releases = [...plan.releases].sort(
		(a, b) => order[a.type] - order[b.type] || a.name.localeCompare(b.name),
	);
	const width = Math.max(...releases.map((r) => r.name.length));

	console.log(
		`\n${plan.changesets.length} changeset(s) across ${unreleased} commit(s) not yet on \`${TARGET_BRANCH}\`:\n`,
	);
	for (const r of releases) {
		console.log(
			`  ${r.type.padEnd(5)}  ${r.name.padEnd(width)}  ${r.oldVersion} → ${r.newVersion}`,
		);
	}
	return releases;
}

/** The promotion PR body: what shipped, derived from the plan rather than hand-written. */
function buildPrBody(releases, plan) {
	const row = (r) =>
		`| \`${r.name}\` | ${r.type} | ${r.oldVersion} → **${r.newVersion}** |`;
	return [
		`Promotes \`${RELEASE_BRANCH}\` to \`${TARGET_BRANCH}\`, consuming ${plan.changesets.length} changeset(s).`,
		"",
		"| Package | Bump | Version |",
		"| --- | --- | --- |",
		...releases.map(row),
		"",
		"Generated by `pnpm release`. Per-change detail is in each package's `CHANGELOG.md` in this diff.",
		"",
		"> [!IMPORTANT]",
		"> Merging this deploys production. Check the Railway `api` service and the Vercel projects",
		"> after the merge — see `docs/railway-deployment.md`.",
	].join("\n");
}

async function confirm(question) {
	if (assumeYes) return true;
	if (!process.stdin.isTTY) {
		fail(
			"Not an interactive terminal, so the confirmation prompt cannot be shown.",
			"Re-run with --yes if you are sure.",
		);
	}
	const rl = createInterface({ input: process.stdin, output: process.stdout });
	try {
		const answer = await rl.question(`\n${question} (y/N) `);
		return answer.trim().toLowerCase() === "y";
	} finally {
		rl.close();
	}
}

async function main() {
	const { unreleased } = preflight();
	const plan = readPlan();
	const releases = printPlan(plan, unreleased);

	if (dryRun) {
		console.log("\n· --dry-run: stopping before any changes.");
		return;
	}

	if (
		!(await confirm(
			`Version these packages and open a PR into \`${TARGET_BRANCH}\`?`,
		))
	) {
		console.log("· Aborted. Nothing was changed.");
		return;
	}

	console.log("\n· Consuming changesets…");
	pnpm(["changeset", "version"], { capture: false });

	// Version bumps can move internal dependency ranges, which the lockfile records. Without
	// this the release PR fails CI on `--frozen-lockfile`.
	console.log("· Updating the lockfile…");
	pnpm(["install", "--lockfile-only"], { capture: false });

	// Guard against committing a no-op: if the changeset files are still there, `version` did
	// not do what we think it did, and the commit would be a lie.
	// README.md is changesets' own scaffolding — always present, never consumed. Counting it
	// would make this guard fire on every successful release.
	const leftover = existsSync(".changeset")
		? readdirSync(".changeset").filter(
				(f) => f.endsWith(".md") && f !== "README.md",
			)
		: [];
	if (leftover.length) {
		fail(
			"`changeset version` left changesets behind — refusing to commit.",
			`Still present: ${leftover.join(", ")}`,
		);
	}
	if (!git("status", "--porcelain")) {
		fail("`changeset version` produced no changes — refusing to commit.");
	}

	console.log("· Committing…");
	git("add", "-A");
	git("commit", "-m", "chore: version packages");

	console.log(`· Pushing to origin/${RELEASE_BRANCH}…`);
	try {
		run("git", ["push", "origin", RELEASE_BRANCH], { capture: false });
	} catch {
		fail(
			`Push to \`${RELEASE_BRANCH}\` was rejected.`,
			"That branch requires a PR unless you hold the Admin bypass. The version commit is\n  made locally — push it as a branch and PR it into develop, then re-run this script.",
		);
	}

	const existing = run("gh", [
		"pr",
		"list",
		"--base",
		TARGET_BRANCH,
		"--head",
		RELEASE_BRANCH,
		"--state",
		"open",
		"--json",
		"url",
		"--jq",
		".[0].url // empty",
	]);
	if (existing) {
		console.log(
			`\n✓ Release PR already open, updated with the version commit:\n  ${existing}`,
		);
		return;
	}

	console.log("· Opening the release PR…");
	const url = run("gh", [
		"pr",
		"create",
		"--base",
		TARGET_BRANCH,
		"--head",
		RELEASE_BRANCH,
		"--title",
		prTitle,
		"--body",
		buildPrBody(releases, plan),
	]);
	console.log(`\n✓ ${url.split("\n").pop()}`);
}

try {
	await main();
} finally {
	rmSync(STATUS_FILE, { force: true });
}
