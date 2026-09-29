// @vitest-environment happy-dom
import { APP_ROLE_LABELS, APP_ROLES } from "@mcmec/lib/constants/roles";
import { cleanup, fireEvent, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
	CENTRAL_APPS,
	EMPLOYEE_ID,
	EMPLOYEE_NAME,
	EMPLOYEE_TITLE,
	employeeWith,
	type ListedUser,
	MEETING_ID,
	NOTICE_ID,
	noEmployeeWith,
	renderAt,
	signedOut,
	USER_ID,
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
				screen.getByText(
					`${app.name} requires the ${APP_ROLE_LABELS[role]} App Role, and your account does not have it.`,
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
				screen.getByRole("navigation", {
					name: "Self Service Portal sections",
				}),
			).toBeTruthy();
			expect(
				screen.queryByRole("navigation", { name: `${app.name} sections` }),
			).toBeNull();
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
		// HR and Admin read only the root's `employees`: they share the shell's instance.
		["/hr", ["employees"]],
		["/hr/employees", ["employees"]],
		[`/hr/employees/${EMPLOYEE_ID}`, ["employees"]],
		[`/hr/employees/${EMPLOYEE_ID}/edit`, ["employees"]],
		["/admin", ["employees"]],
		["/admin/users", ["employees"]],
	])("%s asks for %j", async (path, tables) => {
		// Every App Role, so each route renders rather than refusing; the gates have their own rows.
		const { asked, router } = await renderAt(
			path,
			employeeWith([...APP_ROLES]),
		);

		expect(router.state.location.pathname).toBe(path);
		expect(router.state.statusCode).toBe(200);
		// A path no route matches still settles on 200 in the browser, with no table asked for
		// beyond the shell's, so the row would pass on a route that does not exist. Every match
		// must have loaded, and none may be the not-found fallback.
		expect(
			router.state.matches.map((match) => ({
				globalNotFound: match.globalNotFound ?? false,
				routeId: match.routeId,
				status: match.status,
			})),
		).toEqual(
			router.state.matches.map((match) => ({
				globalNotFound: false,
				routeId: match.routeId,
				status: "success",
			})),
		);
		expect(asked()).toEqual(tables);
	});
});

describe("Admin's Users grid", () => {
	const ADMIN = employeeWith(["manage_users"]);
	const linked: ListedUser = {
		email: "pat@example.com",
		id: USER_ID,
		name: "pat",
		role: "manage_users",
	};
	const unlinked: ListedUser = {
		email: "orphan@example.com",
		id: "123e4567-e89b-12d3-a456-426614174099",
		name: "orphan",
		role: null,
	};

	/** The Employee cell of the row for `email`, found by the column's header. */
	async function employeeCellFor(email: string) {
		const header = await screen.findByRole("columnheader", {
			name: "Employee",
		});
		const column = within(header.closest("tr") as HTMLElement)
			.getAllByRole("columnheader")
			.indexOf(header);
		const row = screen.getByText(email).closest("tr") as HTMLElement;
		return within(row).getAllByRole("cell")[column] as HTMLElement;
	}

	it("shows the linked Employee's display name and title", async () => {
		await renderAt("/admin/users", ADMIN, { users: [linked, unlinked] });

		const cell = await employeeCellFor(linked.email);
		expect(within(cell).getByText(EMPLOYEE_NAME)).toBeTruthy();
		expect(within(cell).getByText(EMPLOYEE_TITLE)).toBeTruthy();
		// Read-only, and no way into HR from here (#238).
		expect(within(cell).queryByRole("link")).toBeNull();
	});

	it("shows a dash for a User with no linked Employee", async () => {
		await renderAt("/admin/users", ADMIN, { users: [linked, unlinked] });

		const cell = await employeeCellFor(unlinked.email);
		expect(cell.textContent).toBe("—");
	});

	it("names HR in plain text when there is no User to list", async () => {
		await renderAt("/admin/users", ADMIN, { users: [] });

		const empty = await screen.findByText(/Invite Employees in HR first\./);
		expect(empty.closest("a")).toBeNull();
		expect(within(empty).queryByRole("link")).toBeNull();
	});

	it("is titled Users", async () => {
		await renderAt("/admin/users", ADMIN, { users: [linked] });

		expect(await screen.findByRole("heading", { name: "Users" })).toBeTruthy();
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

	it("links to HR and Admin inside central, not on their old origins", async () => {
		await renderAt("/", employeeWith(["manage_employees", "manage_users"]));
		expect(await screen.findByText(EMPLOYEE_NAME)).toBeTruthy();

		const trigger = document.querySelector(SWITCHER_MENU);
		fireEvent.keyDown(trigger as Element, { key: "Enter" });

		const menu = await screen.findByRole("menu");
		const links = within(menu)
			.getAllByRole("menuitem")
			.map((item) => ({
				href: (item.closest("a") ?? item.querySelector("a"))?.getAttribute(
					"href",
				),
				name: item.querySelector(".font-medium")?.textContent,
			}));
		expect(links).toEqual([
			{ href: "/", name: "Self Service Portal" },
			{ href: "/hr", name: "HR" },
			{ href: "/admin", name: "Admin" },
		]);
	});
});
