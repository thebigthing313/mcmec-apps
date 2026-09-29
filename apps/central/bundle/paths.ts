import { fileURLToPath } from "node:url";

/** Where a central build records its chunk membership. Git-ignored; a turbo build output. */
export const MEMBERSHIP_FILE = fileURLToPath(
	new URL("../.bundle/membership.json", import.meta.url),
);

/** The checked-in ceiling. Raised only by a visible diff, with a reason in the PR. */
export const BUDGET_FILE = fileURLToPath(
	new URL("./budget.json", import.meta.url),
);

export const REPO_ROOT = fileURLToPath(new URL("../../../", import.meta.url));
