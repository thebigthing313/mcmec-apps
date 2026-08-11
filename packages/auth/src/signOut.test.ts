import { beforeEach, describe, expect, it, vi } from "vitest";
import { UnauthenticatedError } from "./errors";

const mockSignOut = vi.fn();
const mockClient = {
	signOut: mockSignOut,
};

import { signOut } from "./signOut";

beforeEach(() => {
	vi.clearAllMocks();
});

describe("signOut", () => {
	it("should successfully sign out", async () => {
		mockSignOut.mockResolvedValue({
			data: { success: true },
			error: null,
		});

		await expect(
			// biome-ignore lint/suspicious/noExplicitAny: structural mock of the Better Auth client
			signOut({ client: mockClient as any }),
		).resolves.toBeUndefined();
		expect(mockSignOut).toHaveBeenCalledWith();
	});

	it("should throw UnauthenticatedError when sign out fails", async () => {
		mockSignOut.mockResolvedValue({
			data: null,
			error: { message: "Sign out failed" },
		});

		await expect(
			// biome-ignore lint/suspicious/noExplicitAny: structural mock of the Better Auth client
			signOut({ client: mockClient as any }),
		).rejects.toThrow(UnauthenticatedError);
	});

	it("should throw UnauthenticatedError on network errors", async () => {
		mockSignOut.mockResolvedValue({
			data: null,
			error: { message: "Network error", status: 500 },
		});

		await expect(
			// biome-ignore lint/suspicious/noExplicitAny: structural mock of the Better Auth client
			signOut({ client: mockClient as any }),
		).rejects.toThrow(UnauthenticatedError);
	});
});
