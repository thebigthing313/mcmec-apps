/**
 * Renders central's real route tree in happy-dom, with a stubbed session and a fake collection
 * registry, so route tests exercise the gates, the shell and the tables each route asks for
 * without a network. Used by the route tests (#242).
 */
import type { AuthClient } from "@mcmec/auth/client";
import { AVAILABLE_APPS, isCentralPath } from "@mcmec/lib/constants/apps";
import { createCollection, localOnlyCollectionOptions } from "@tanstack/db";
import { QueryClient } from "@tanstack/react-query";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { render } from "@testing-library/react";
import { vi } from "vitest";
import type { CentralCollections } from "../lib/collections";
import { createCollectionRegistry } from "../lib/collections/registry";
import { createCentralRouter } from "../router";

/**
 * The Apps folded into central, read from the App list the switcher reads. The route tests
 * generate their gate rows from it, so an App gets them the moment its `href` becomes a path.
 */
export const CENTRAL_APPS = AVAILABLE_APPS.filter((app) =>
	isCentralPath(app.href),
);

export const USER_ID = "123e4567-e89b-12d3-a456-426614174000";
export const EMPLOYEE_ID = "123e4567-e89b-12d3-a456-426614174002";
export const NOTICE_ID = "123e4567-e89b-12d3-a456-426614174010";
export const MEETING_ID = "123e4567-e89b-12d3-a456-426614174020";
export const EMPLOYEE_NAME = "Pat Example";

/** Who is signed in: nobody, or a User with an optional linked Employee and some App Roles. */
export type Session =
	| { signedIn: false }
	| { signedIn: true; employeeId: string | null; permissions: string[] };

export const signedOut: Session = { signedIn: false };

export function employeeWith(permissions: string[]): Session {
	return { employeeId: EMPLOYEE_ID, permissions, signedIn: true };
}

/** A User whose login is linked to no Employee, whatever App Roles it holds. */
export function noEmployeeWith(permissions: string[]): Session {
	return { employeeId: null, permissions, signedIn: true };
}

function fakeAuthClient(session: Session): AuthClient {
	const client = {
		getSession: async () =>
			session.signedIn
				? {
						data: {
							employeeId: session.employeeId,
							permissions: session.permissions,
							session: {},
							user: { email: "pat@example.com", id: USER_ID },
						},
						error: null,
					}
				: { data: null, error: null },
		signOut: async () => ({ data: { success: true }, error: null }),
	};
	return client as unknown as AuthClient;
}

function localTable<T extends { id: string }>(id: string, rows: T[]) {
	return async () =>
		createCollection(
			localOnlyCollectionOptions({
				getKey: (row: T) => row.id,
				id,
				initialData: rows,
			}),
		);
}

/**
 * Central's registry over local-only collections seeded with one row each, with a spy on
 * `use` so a test can read back exactly which tables were asked for.
 */
function fakeCollections() {
	const registry = createCollectionRegistry({
		employees: localTable("employees", [
			{
				display_name: EMPLOYEE_NAME,
				display_title: "Inspector",
				id: EMPLOYEE_ID,
				user_id: USER_ID,
			},
		]),
		meetings: localTable("meetings", [
			{
				id: MEETING_ID,
				is_cancelled: false,
				location: "Commission office",
				meeting_at: new Date("2026-03-12T19:00:00Z"),
				minutes_url: null,
				name: "Regular Meeting",
				notes: null,
				notice_url: null,
			},
		]),
		noticeTypes: localTable("notice_types", [
			{ id: "notice-type", name: "Legal Notice" },
		]),
		notices: localTable("notices", [
			{
				content: null,
				id: NOTICE_ID,
				is_archived: false,
				is_published: true,
				notice_date: new Date("2026-01-05T00:00:00Z"),
				notice_type_id: "notice-type",
				title: "Budget Hearing",
			},
		]),
	});
	const use = vi.spyOn(registry, "use");
	return {
		/** Every table asked for so far, sorted and without repeats. */
		asked: () => [...new Set(use.mock.calls.flat())].sort(),
		registry: registry as unknown as CentralCollections,
	};
}

/** Opens `path` as `session`, and waits for the router to settle. */
export async function renderAt(path: string, session: Session) {
	const { asked, registry } = fakeCollections();
	const router = createCentralRouter({
		authClient: fakeAuthClient(session),
		collections: registry,
		history: createMemoryHistory({ initialEntries: [path] }),
		queryClient: new QueryClient(),
	});
	await router.load();
	const view = render(<RouterProvider router={router} />);
	return { asked, router, view };
}
