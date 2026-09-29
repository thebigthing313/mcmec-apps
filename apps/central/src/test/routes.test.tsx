// @vitest-environment happy-dom
import { APP_ROLE_LABELS, APP_ROLES } from "@mcmec/lib/constants/roles";
import { cleanup, fireEvent, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
	CENTRAL_APPS,
	DOCUMENT_ID,
	DOCUMENT_TYPE_ID,
	EMPLOYEE_ID,
	EMPLOYEE_NAME,
	EMPLOYEE_TITLE,
	employeeWith,
	INSECTICIDE_ID,
	JOB_POSTING_ID,
	type ListedUser,
	MEETING_ID,
	NOTICE_ID,
	NOTICE_TYPE_ID,
	noEmployeeWith,
	PUBLIC_REQUEST_ID,
	renderAt,
	SPRAY_MISSION_ID,
	signedOut,
	USER_ID,
} from "./harness";

const WM = "/website-management";

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

describe("a deep link into Website Management without its App Role", () => {
	// TanStack Router runs every `beforeLoad` in a match even after the App's gate has thrown, so
	// a screen below the gate must not reach the registry for a refused User. The App's own row
	// above opens `/website-management`; this one opens a screen beneath it.
	it("keeps the URL, refuses, and loads none of the App's tables", async () => {
		const path = `${WM}/notices/${NOTICE_ID}`;
		const { asked, router } = await renderAt(
			path,
			employeeWith(["manage_employees"]),
		);

		expect(router.state.location.pathname).toBe(path);
		expect(
			await screen.findByRole("heading", {
				name: "You do not have access to Website Management",
			}),
		).toBeTruthy();
		expect(asked()).toEqual(["employees"]);
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
		// Website Management: each screen asks for what it reads, and nothing for the App itself.
		// The Signal Strip reads across the App, so it is the one screen that asks for many.
		[
			WM,
			[
				"documents",
				"employees",
				"insecticides",
				"jobPostings",
				"meetings",
				"notices",
				"publicRequests",
				"spraySchedules",
			],
		],
		[`${WM}/notices`, ["employees", "noticeTypes", "notices"]],
		[`${WM}/notices/create`, ["employees", "noticeTypes", "notices"]],
		[`${WM}/notices/${NOTICE_ID}`, ["employees", "noticeTypes", "notices"]],
		[
			`${WM}/notices/${NOTICE_ID}/edit`,
			["employees", "noticeTypes", "notices"],
		],
		[`${WM}/meetings`, ["employees", "meetings"]],
		[`${WM}/meetings/create`, ["employees", "meetings"]],
		[`${WM}/meetings/${MEETING_ID}`, ["employees", "meetings"]],
		[`${WM}/meetings/${MEETING_ID}/edit`, ["employees", "meetings"]],
		[`${WM}/documents`, ["documentTypes", "documents", "employees"]],
		[`${WM}/documents/create`, ["documentTypes", "documents", "employees"]],
		[
			`${WM}/documents/${DOCUMENT_ID}`,
			["documentTypes", "documents", "employees"],
		],
		[
			`${WM}/documents/${DOCUMENT_ID}/edit`,
			["documentTypes", "documents", "employees"],
		],
		[`${WM}/job-postings`, ["employees", "jobPostings"]],
		[`${WM}/job-postings/create`, ["employees", "jobPostings"]],
		[`${WM}/job-postings/${JOB_POSTING_ID}`, ["employees", "jobPostings"]],
		[`${WM}/job-postings/${JOB_POSTING_ID}/edit`, ["employees", "jobPostings"]],
		...["", "/create", `/${SPRAY_MISSION_ID}`, `/${SPRAY_MISSION_ID}/edit`].map(
			(rest): [string, string[]] => [
				`${WM}/spray-missions${rest}`,
				[
					"employees",
					"insecticides",
					"municipalities",
					"sprayScheduleMunicipalities",
					"spraySchedules",
				],
			],
		),
		[`${WM}/insecticides`, ["employees", "insecticides"]],
		[`${WM}/insecticides/create`, ["employees", "insecticides"]],
		[`${WM}/insecticides/${INSECTICIDE_ID}`, ["employees", "insecticides"]],
		[
			`${WM}/insecticides/${INSECTICIDE_ID}/edit`,
			["employees", "insecticides"],
		],
		// The two on-demand tables are asked for like any other; only their sync differs.
		[`${WM}/weekly-activity`, ["employees", "mosquitoActivityData"]],
		[`${WM}/public-requests`, ["employees", "publicRequests", "zipCodes"]],
		[
			`${WM}/public-requests/${PUBLIC_REQUEST_ID}`,
			["employees", "publicRequests", "zipCodes"],
		],
		// A category's screens read what it holds too: the count decides whether Delete is offered.
		...["", "/create", `/${NOTICE_TYPE_ID}`, `/${NOTICE_TYPE_ID}/edit`].map(
			(rest): [string, string[]] => [
				`${WM}/notice-categories${rest}`,
				["employees", "noticeTypes", "notices"],
			],
		),
		...["", "/create", `/${DOCUMENT_TYPE_ID}`, `/${DOCUMENT_TYPE_ID}/edit`].map(
			(rest): [string, string[]] => [
				`${WM}/document-categories${rest}`,
				["documentTypes", "documents", "employees"],
			],
		),
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

describe("Self Service Portal dashboard", () => {
	const SWITCHER_POINTER =
		"Your Apps are in the switcher at the top of the sidebar.";
	const PORTAL_ONLY =
		"The Commission's public meetings and notices are in the sidebar.";

	it("does not point a User with no App Role at the switcher", async () => {
		await renderAt("/", employeeWith([]));

		expect(await screen.findByText(PORTAL_ONLY)).toBeTruthy();
		expect(screen.queryByText(SWITCHER_POINTER)).toBeNull();
	});

	it("points a User holding an App Role at the switcher", async () => {
		await renderAt("/", employeeWith(["manage_employees"]));

		expect(await screen.findByText(SWITCHER_POINTER)).toBeTruthy();
		expect(screen.queryByText(PORTAL_ONLY)).toBeNull();
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

	it("links to every App inside central, not on their old origins", async () => {
		await renderAt(
			"/",
			employeeWith(["manage_website", "manage_employees", "manage_users"]),
		);
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
			{ href: "/website-management", name: "Website Management" },
			{ href: "/hr", name: "HR" },
			{ href: "/admin", name: "Admin" },
		]);
	});
});
