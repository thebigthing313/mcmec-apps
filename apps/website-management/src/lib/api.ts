import { API_URL } from "./queryClient";

/**
 * Calls a non-CRUD backend endpoint (the ones the TanStack DB collections can't express:
 * the spray-schedule junction, the mosquito-activity import). Reads and writes that map to
 * a single table go through the collections instead.
 *
 * Always credentialed — the Better Auth session cookie is what authorizes the call.
 */
export async function apiFetch<T>(
	path: string,
	init?: RequestInit,
): Promise<T> {
	const res = await fetch(`${API_URL}${path}`, {
		...init,
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
			...init?.headers,
		},
	});

	// Errors may not carry JSON (a 502 from the proxy, say), so read defensively.
	const body = (await res.json().catch(() => null)) as
		| (T & { error?: string })
		| null;

	if (!res.ok) {
		throw new Error(body?.error ?? `Request failed (${res.status})`);
	}
	return body as T;
}
