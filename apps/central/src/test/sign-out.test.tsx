// @vitest-environment happy-dom
/**
 * Sign-out → sign-in in the same tab (#266). Drives central's real router and registry, over
 * collections whose sync counts its own starts and stops — one start stands in for one Electric
 * ShapeStream. The first snapshot lands a round trip after the sync starts, as Electric's does:
 * with an instant snapshot the bug does not show, because the loader that refreshes a reused
 * route's context finishes before the route renders.
 */
import type { AuthClient } from "@mcmec/auth/client";
import { createCollection } from "@tanstack/db";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import type { CentralCollections } from "../lib/collections";
import { createCollectionRegistry } from "../lib/collections/registry";
import { createCentralRouter } from "../router";
import {
	EMPLOYEE_ID,
	EMPLOYEE_NAME,
	EMPLOYEE_TITLE,
	NOTICE_TYPE_ID,
	USER_ID,
} from "./harness";

afterEach(cleanup);

const SNAPSHOT_LATENCY_MS = 20;

/** How many of a table's builds are syncing right now, in build order. */
type Running = Record<string, number[]>;

/**
 * A registry over `tables`, each seeded with `rows`, recording every build of every table and
 * whether its sync is running.
 */
function recordedCollections(tables: Record<string, { id: string }[]>) {
	const builds: Record<string, { starts: number; stops: number }[]> = {};
	const definitions = Object.fromEntries(
		Object.entries(tables).map(([name, rows]) => {
			builds[name] = [];
			const define = async () => {
				const build = { starts: 0, stops: 0 };
				builds[name]?.push(build);
				return createCollection<{ id: string }, string>({
					getKey: (row) => row.id,
					id: `${name}-${builds[name]?.length}`,
					startSync: false,
					sync: {
						sync: ({ begin, write, commit, markReady }) => {
							build.starts++;
							const arrival = setTimeout(() => {
								begin();
								for (const value of rows) write({ type: "insert", value });
								commit();
								markReady();
							}, SNAPSHOT_LATENCY_MS);
							return () => {
								clearTimeout(arrival);
								build.stops++;
							};
						},
					},
				});
			};
			return [name, define];
		}),
	);
	return {
		registry: createCollectionRegistry(
			definitions,
		) as unknown as CentralCollections,
		running: (): Running =>
			Object.fromEntries(
				Object.entries(builds).map(([name, list]) => [
					name,
					list.map((build) => build.starts - build.stops),
				]),
			),
	};
}

const EMPLOYEE = {
	display_name: EMPLOYEE_NAME,
	display_title: EMPLOYEE_TITLE,
	id: EMPLOYEE_ID,
	user_id: USER_ID,
};

/** Opens `path` signed in with `permissions`; the auth client's sign-out really signs out. */
async function signInAt(
	path: string,
	permissions: string[],
	tables: Record<string, { id: string }[]>,
) {
	let signedIn = true;
	const authClient = {
		getSession: async () =>
			signedIn
				? {
						data: {
							employeeId: EMPLOYEE_ID,
							permissions,
							session: {},
							user: { email: "pat@example.com", id: USER_ID },
						},
						error: null,
					}
				: { data: null, error: null },
		signOut: async () => {
			signedIn = false;
			return { data: { success: true }, error: null };
		},
	} as unknown as AuthClient;
	const { registry, running } = recordedCollections(tables);
	const queryClient = new QueryClient();
	const router = createCentralRouter({
		apiUrl: "https://api.test",
		authClient,
		collections: registry,
		history: createMemoryHistory({ initialEntries: [path] }),
		queryClient,
	});
	await router.load();
	// As main.tsx renders it, StrictMode included.
	render(
		<StrictMode>
			<QueryClientProvider client={queryClient}>
				<RouterProvider router={router} />
			</QueryClientProvider>
		</StrictMode>,
	);
	await screen.findAllByText(EMPLOYEE_NAME);

	return {
		/** What the login page does on success: the session exists again, and it goes home. */
		async signInAgain() {
			signedIn = true;
			await act(() => router.navigate({ to: "/" }));
			await screen.findAllByText(EMPLOYEE_NAME);
		},
		async open(to: string) {
			await act(() => router.navigate({ to }));
			await settle();
		},
		router,
		running,
	};
}

/** Lets every pending snapshot land and every effect run. */
const settle = () =>
	act(
		() =>
			new Promise((resolve) => setTimeout(resolve, 3 * SNAPSHOT_LATENCY_MS)),
	);

async function logOutFromUserMenu() {
	const trigger = document.querySelector(
		"[data-sidebar='footer'] [aria-haspopup='menu']",
	);
	fireEvent.keyDown(trigger as Element, { key: "Enter" });
	fireEvent.click(await screen.findByRole("menuitem", { name: "Log out" }));
}

describe("signing out and back in in the same tab", () => {
	it("stops the previous session's employees, and the next session syncs one", async () => {
		const app = await signInAt("/", [], { employees: [EMPLOYEE] });
		await settle();
		expect(app.running()).toEqual({ employees: [1] });

		await logOutFromUserMenu();
		await waitFor(() =>
			expect(app.router.state.location.pathname).toBe("/login"),
		);
		await settle();
		expect(app.running()).toEqual({ employees: [0] });

		await app.signInAgain();
		await settle();
		expect(app.running()).toEqual({ employees: [0, 1] });
	});

	it("does the same from the refusal page's Sign out", async () => {
		const app = await signInAt("/hr", [], { employees: [EMPLOYEE] });
		fireEvent.click(await screen.findByRole("button", { name: "Sign out" }));
		await waitFor(() =>
			expect(app.router.state.location.pathname).toBe("/login"),
		);
		await settle();
		expect(app.running()).toEqual({ employees: [0] });

		await app.signInAgain();
		await settle();
		expect(app.running()).toEqual({ employees: [0, 1] });
	});

	it("revives none of a Website Management screen's tables when the next User opens it", async () => {
		const path = "/website-management/notices";
		const app = await signInAt(path, ["manage_website"], {
			employees: [EMPLOYEE],
			notices: [],
			noticeTypes: [{ id: NOTICE_TYPE_ID }],
		});
		await settle();
		expect(app.running()).toEqual({
			employees: [1],
			notices: [1],
			noticeTypes: [1],
		});

		await logOutFromUserMenu();
		await waitFor(() =>
			expect(app.router.state.location.pathname).toBe("/login"),
		);
		await app.signInAgain();
		await app.open(path);

		expect(app.running()).toEqual({
			employees: [0, 1],
			notices: [0, 1],
			noticeTypes: [0, 1],
		});
	});
});
