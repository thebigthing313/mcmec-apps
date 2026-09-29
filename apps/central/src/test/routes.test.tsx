// @vitest-environment happy-dom
import { APP_ROLES } from "@mcmec/lib/constants/roles";
import { cleanup, fireEvent, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
	CENTRAL_APPS,
	EMPLOYEE_NAME,
	employeeWith,
	MEETING_ID,
	NOTICE_ID,
	noEmployeeWith,
	renderAt,
	signedOut,
} from "./harness";

afterEach(cleanup);

const NO_EMPLOYEE_HEADING = "Your account is not linked to an employee record";

it("opens only the Self Service Portal without an App Role", () => {
	// The refusal row below is generated only for Apps with a role, so an App folded in with
	// `requiredPermission: null` by mistake would skip it. This catches that instead.
	expect(
		CENTRAL_APPS.filter((app) => !app.requiredPermission).map(
			(app) => app.name,
		),
	).toEqual(["Self Service Portal"]);
});

/**
 * The gate rows, generated from the App list the switcher reads: every App folded into central
 * gets them, so an App added without a gate fails here rather than shipping open.
 */
describe.each(CENTRAL_APPS)("$name", (app) => {
	const role = app.requiredPermission;
	const holding = role ? [role] : [];

	it("sends a signed-out visitor to /login", async () => {
		const { asked, router } = await renderAt(app.href, signedOut);

		expect(router.state.location.pathname).toBe("/login");
		expect(asked()).toEqual([]);
	});

	it("refuses a User with no linked Employee full-page, with no shell", async () => {
		const { asked, router } = await renderAt(app.href, noEmployeeWith(holding));

		expect(router.state.location.pathname).toBe(app.href);
		expect(
			await screen.findByRole("heading", { name: NO_EMPLOYEE_HEADING }),
		).toBeTruthy();
		expect(screen.getByRole("button", { name: "Sign out" })).toBeTruthy();
		expect(screen.queryByRole("navigation")).toBeNull();
		expect(asked()).toEqual([]);
	});

	if (role) {
		it("keeps the URL and refuses inside the shell for a User without its App Role", async () => {
			const others = APP_ROLES.filter((other) => other !== role);
			const { asked, router } = await renderAt(app.href, employeeWith(others));

			expect(router.state.location.pathname).toBe(app.href);
			expect(
				await screen.findByRole("heading", {
					name: `You do not have access to ${app.name}`,
				}),
			).toBeTruthy();
			expect(
				screen.getByRole("navigation", {
					name: "Self Service Portal sections",
				}),
			).toBeTruthy();
			expect(asked()).toEqual(["employees"]);
		});
	}

	it("renders in the shell for a User holding its App Role", async () => {
		const { router } = await renderAt(app.href, employeeWith(holding));

		expect(router.state.location.pathname).toBe(app.href);
		expect(await screen.findByText(EMPLOYEE_NAME)).toBeTruthy();
		expect(
			screen.getByRole("navigation", { name: `${app.name} sections` }),
		).toBeTruthy();
		expect(
			screen.queryByRole("heading", { name: /do not have access/ }),
		).toBeNull();
	});
});

/**
 * Which tables each route asks the registry for. Written out rather than derived: the point is
 * that a route asking for one table too many — the next App's, say — shows up as a diff here.
 */
describe("tables each route asks for", () => {
	it.each([
		["/", ["employees"]],
		["/notices", ["employees", "noticeTypes", "notices"]],
		[`/notices/${NOTICE_ID}`, ["employees", "noticeTypes", "notices"]],
		["/meetings", ["employees", "meetings"]],
		[`/meetings/${MEETING_ID}`, ["employees", "meetings"]],
	])("%s asks for %j", async (path, tables) => {
		const { asked, router } = await renderAt(path, employeeWith([]));

		expect(router.state.location.pathname).toBe(path);
		expect(router.state.statusCode).toBe(200);
		expect(asked()).toEqual(tables);
	});
});

/** The switcher's menu trigger, in the sidebar header (NavUser's menu is in the footer). */
const SWITCHER_MENU = "[data-sidebar='header'] [aria-haspopup='menu']";

describe("app switcher", () => {
	it("shows the one accessible App with no dropdown", async () => {
		await renderAt("/", employeeWith([]));

		expect(await screen.findByText(EMPLOYEE_NAME)).toBeTruthy();
		// The row stays: it is the identity mark, and a link home so it can take focus.
		const row = document.querySelector("[data-sidebar='header'] a");
		expect(row?.getAttribute("href")).toBe("/");
		expect(row?.textContent).toContain("Self Service Portal");
		expect(document.querySelector(SWITCHER_MENU)).toBeNull();
	});

	it("lists only the Apps the User can open", async () => {
		await renderAt("/", employeeWith(["manage_employees"]));
		expect(await screen.findByText(EMPLOYEE_NAME)).toBeTruthy();

		const trigger = document.querySelector(SWITCHER_MENU);
		expect(trigger).not.toBeNull();
		fireEvent.keyDown(trigger as Element, { key: "Enter" });

		const menu = await screen.findByRole("menu");
		const names = within(menu)
			.getAllByRole("menuitem")
			.map((item) => item.querySelector(".font-medium")?.textContent);
		expect(names).toEqual(["Self Service Portal", "HR"]);
	});
});
