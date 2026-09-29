// @vitest-environment happy-dom
/**
 * The shell's refusal for an App Role, exercised through a fixture App.
 *
 * No gated App is folded into central yet (HR and Admin are next, #247), so the table-driven
 * rows in routes.test.tsx have no gated App to generate a refusal row for. This file mounts one
 * throwaway App under the real root signed-in layout, gated exactly as a real App's layout route
 * will be, so the refusal path — URL kept, `AppRoleRequired` in the content area, the Self
 * Service Portal's rail — is covered from the shell PR on. Delete it once routes.test.tsx has a
 * gated App of its own.
 */

import { createRoute, Outlet } from "@tanstack/react-router";
import { cleanup, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { requireAppRole } from "../lib/gates";
import { Route as SignedInRoute } from "../routes/(app)/route";
import { EMPLOYEE_NAME, employeeWith, renderAt } from "./harness";

const FIXTURE_PATH = "/fixture-app";

beforeAll(() => {
	const fixture = createRoute({
		beforeLoad: ({ context }) => requireAppRole(context.claims, "manage_users"),
		component: () => (
			<>
				<p>Fixture App content</p>
				<Outlet />
			</>
		),
		getParentRoute: () => SignedInRoute,
		path: FIXTURE_PATH,
		staticData: {
			activeApp: "Admin",
			sidebar: [
				{
					items: [
						{ icon: null, label: "Users", linkProps: { to: FIXTURE_PATH } },
					],
				},
			],
		},
	});
	const siblings = Object.values(SignedInRoute.children ?? {});
	SignedInRoute.addChildren([...siblings, fixture]);
});

afterEach(cleanup);

describe("a gated App", () => {
	it("keeps the URL and refuses inside the shell, with the portal's rail", async () => {
		const { asked, router } = await renderAt(
			FIXTURE_PATH,
			employeeWith(["manage_website", "manage_employees"]),
		);

		expect(router.state.location.pathname).toBe(FIXTURE_PATH);
		expect(
			await screen.findByRole("heading", {
				name: "You do not have access to Admin",
			}),
		).toBeTruthy();
		expect(
			screen.getByText(
				"Admin requires the Users App Role, and your account does not have it.",
			),
		).toBeTruthy();
		const back = screen.getByRole("link", {
			name: "Go to the Self Service Portal",
		});
		expect(back.getAttribute("href")).toBe("/");
		expect(screen.getByRole("button", { name: "Sign out" })).toBeTruthy();

		// Inside the shell: the signed-in Employee, and the portal's rail rather than the App's.
		expect(screen.getByText(EMPLOYEE_NAME)).toBeTruthy();
		expect(
			screen.getByRole("navigation", { name: "Self Service Portal sections" }),
		).toBeTruthy();
		expect(screen.queryByText("Fixture App content")).toBeNull();
		expect(asked()).toEqual(["employees"]);
	});

	it("renders with its own rail for a User holding the App Role", async () => {
		await renderAt(FIXTURE_PATH, employeeWith(["manage_users"]));

		expect(await screen.findByText("Fixture App content")).toBeTruthy();
		expect(
			screen.getByRole("navigation", { name: "Admin sections" }),
		).toBeTruthy();
	});
});
