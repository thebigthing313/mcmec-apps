/**
 * Refuses to install on a Node version below `engines.node`.
 *
 * This exists because the failure it replaces is silent. pnpm does not error when an optional
 * dependency declares an `engines` range the running Node misses — it quietly skips the package.
 * `@tanstack/react-start` pulls in `oxc-transform`, whose platform-specific native binding is an
 * optional dependency requiring `^20.19.0 || >=22.12.0`, so building `public` on Node 22.11 does
 * not complain about Node at all: it installs cleanly and then fails at build time with
 * `Cannot find native binding` and a link to an unrelated npm bug. That cost several deploys to
 * trace (see #115). One clear message at install time is cheaper than repeating it.
 *
 * Runs as `preinstall`, so `node_modules` does not exist yet — Node builtins only, no `semver`.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** `[major, minor, patch]`, tolerating a leading `v` and omitted trailing parts. */
function parseVersion(version) {
	const [major = 0, minor = 0, patch = 0] = version
		.trim()
		.replace(/^v/, "")
		.split(".")
		.map(Number);
	return [major, minor, patch];
}

function meetsFloor(version, floor) {
	for (let i = 0; i < 3; i++) {
		if (version[i] !== floor[i]) return version[i] > floor[i];
	}
	return true;
}

function fail(message) {
	console.error(`\n[check-node-version] ${message}\n`);
	process.exit(1);
}

const { engines } = JSON.parse(
	readFileSync(join(root, "package.json"), "utf8"),
);
const required = engines?.node ?? "";
const pinned = readFileSync(join(root, ".nvmrc"), "utf8").trim();

// Only a `>=x.y[.z]` floor is understood. Anything else is a range this script would silently
// mis-evaluate, which is the exact class of bug it was written to prevent.
if (!/^>=\s*\d+\.\d+(\.\d+)?$/.test(required)) {
	fail(
		`engines.node is "${required}", but this check only understands a ">=x.y" floor.\n` +
			`Update scripts/check-node-version.mjs to match, or restate engines.node as a floor.`,
	);
}

const floor = parseVersion(required.replace(">=", ""));

if (!meetsFloor(parseVersion(pinned), floor)) {
	fail(
		`.nvmrc pins Node ${pinned}, below the engines.node floor of ${required}.\n` +
			`The pin is what CI and the Railway builds actually run, so it has to clear the floor.`,
	);
}

if (!meetsFloor(parseVersion(process.versions.node), floor)) {
	fail(
		`Node ${process.versions.node} is below the engines.node floor of ${required}.\n` +
			`Install Node ${pinned} (the version in .nvmrc) and try again.\n\n` +
			`Installing anyway would appear to succeed: pnpm skips optional dependencies whose\n` +
			`engines do not match, so the missing package only surfaces later as a build-time\n` +
			`"Cannot find native binding" error that points nowhere near the Node version.`,
	);
}
