import { describe, expect, it } from "vitest";
import { publicSiteUrl } from "./apps";

describe("publicSiteUrl", () => {
	it("links production staff to www, the host that serves every path", () => {
		expect(publicSiteUrl("central.middlesexmosquito.org")).toBe(
			"https://www.middlesexmosquito.org",
		);
	});

	it("links staging staff to the staging public site", () => {
		expect(publicSiteUrl("central-staging.middlesexmosquito.org")).toBe(
			"https://staging.middlesexmosquito.org",
		);
	});

	it("links local staff to the local public site's https port", () => {
		expect(publicSiteUrl("localhost")).toBe("https://localhost:3448");
	});
});
