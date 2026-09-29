/**
 * Renders central's real route tree in happy-dom, with a stubbed session and a fake collection
 * registry, so route tests exercise the gates, the shell and the tables each route asks for
 * without a network. Used by the route tests (#242).
 */
import type { AuthClient } from "@mcmec/auth/client";
import { AVAILABLE_APPS, isCentralPath } from "@mcmec/lib/constants/apps";
import { createCollection, localOnlyCollectionOptions } from "@tanstack/db";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
export const NOTICE_TYPE_ID = "123e4567-e89b-12d3-a456-426614174011";
export const DOCUMENT_ID = "123e4567-e89b-12d3-a456-426614174030";
export const DOCUMENT_TYPE_ID = "123e4567-e89b-12d3-a456-426614174031";
export const INSECTICIDE_ID = "123e4567-e89b-12d3-a456-426614174040";
export const JOB_POSTING_ID = "123e4567-e89b-12d3-a456-426614174050";
export const SPRAY_MISSION_ID = "123e4567-e89b-12d3-a456-426614174060";
export const MUNICIPALITY_ID = "123e4567-e89b-12d3-a456-426614174061";
export const PUBLIC_REQUEST_ID = "123e4567-e89b-12d3-a456-426614174070";
export const ZIP_CODE_ID = "123e4567-e89b-12d3-a456-426614174071";
export const EMPLOYEE_NAME = "Pat Example";
export const EMPLOYEE_TITLE = "Inspector";

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

/** A login as Better Auth's admin plugin lists it for the Users grid. */
export type ListedUser = {
	id: string;
	email: string;
	name: string | null;
	role: string | null;
};

function fakeAuthClient(session: Session, users: ListedUser[]): AuthClient {
	const client = {
		admin: {
			listUsers: async () => ({ data: { users }, error: null }),
		},
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
				created_at: new Date("2025-02-01T00:00:00Z"),
				display_name: EMPLOYEE_NAME,
				display_title: EMPLOYEE_TITLE,
				email: "pat@example.com",
				id: EMPLOYEE_ID,
				updated_at: new Date("2025-02-01T00:00:00Z"),
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
			{ description: null, id: NOTICE_TYPE_ID, name: "Legal Notice" },
		]),
		notices: localTable("notices", [
			{
				content: null,
				id: NOTICE_ID,
				is_archived: false,
				is_published: true,
				notice_date: new Date("2026-01-05T00:00:00Z"),
				notice_type_id: NOTICE_TYPE_ID,
				title: "Budget Hearing",
			},
		]),
		// Website Management's tables. The two on-demand ones are local here like the rest: what
		// these tests check is which tables a route asks for, not how each one syncs.
		documents: localTable("documents", [
			{
				document_type_id: DOCUMENT_TYPE_ID,
				fiscal_year: 2026,
				id: DOCUMENT_ID,
				is_published: true,
				url: "https://example.com/budget.pdf",
			},
		]),
		documentTypes: localTable("document_types", [
			{ description: null, id: DOCUMENT_TYPE_ID, name: "Budget" },
		]),
		insecticides: localTable("insecticides", [
			{
				active_ingredient: "Etofenprox",
				active_ingredient_url: "https://example.com/ai",
				id: INSECTICIDE_ID,
				label_url: "https://example.com/label.pdf",
				msds_url: "https://example.com/sds.pdf",
				trade_name: "Zenivex E20",
				type_name: "Adulticide",
			},
		]),
		jobPostings: localTable("job_postings", [
			{
				content: {},
				id: JOB_POSTING_ID,
				is_closed: false,
				published_at: null,
				title: "Field Inspector",
			},
		]),
		mosquitoActivityData: localTable("mosquito_activity_data", []),
		municipalities: localTable("municipalities", [
			{ id: MUNICIPALITY_ID, name: "Edison" },
		]),
		publicRequests: localTable("public_requests", [
			{
				address_line_1: "1 Main St",
				address_line_2: null,
				created_at: new Date("2026-01-02T00:00:00Z"),
				details: {},
				email: "resident@example.com",
				id: PUBLIC_REQUEST_ID,
				name: "Sam Resident",
				phone: "555-0100",
				request_type: "general_inquiry",
				status: "new",
				zip_code_id: ZIP_CODE_ID,
			},
		]),
		sprayScheduleMunicipalities: localTable("spray_schedule_municipalities", [
			{
				id: "123e4567-e89b-12d3-a456-426614174062",
				municipality_id: MUNICIPALITY_ID,
				spray_schedule_id: SPRAY_MISSION_ID,
			},
		]),
		spraySchedules: localTable("spray_schedules", [
			{
				area_description: "North Edison",
				end_time: "23:00:00",
				id: SPRAY_MISSION_ID,
				insecticide_id: INSECTICIDE_ID,
				map_url: null,
				mission_date: new Date("2026-07-01T00:00:00Z"),
				rain_date: null,
				start_time: "19:00:00",
				status: "scheduled",
			},
		]),
		zipCodes: localTable("zip_codes", [
			{ city: "Edison", code: "08817", id: ZIP_CODE_ID, state: "NJ" },
		]),
	});
	const use = vi.spyOn(registry, "use");
	return {
		/** Every table asked for so far, sorted and without repeats. */
		asked: () => [...new Set(use.mock.calls.flat())].sort(),
		registry: registry as unknown as CentralCollections,
	};
}

/**
 * Opens `path` as `session`, and waits for the router to settle. `users` is what the admin
 * plugin lists, for the Users grid; it defaults to none.
 */
export async function renderAt(
	path: string,
	session: Session,
	{ users = [] }: { users?: ListedUser[] } = {},
) {
	const { asked, registry } = fakeCollections();
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	const router = createCentralRouter({
		apiUrl: "https://api.test",
		authClient: fakeAuthClient(session, users),
		collections: registry,
		history: createMemoryHistory({ initialEntries: [path] }),
		queryClient,
	});
	await router.load();
	// As in main.tsx, which wraps the router in the same provider.
	const view = render(
		<QueryClientProvider client={queryClient}>
			<RouterProvider router={router} />
		</QueryClientProvider>,
	);
	return { asked, router, view };
}
