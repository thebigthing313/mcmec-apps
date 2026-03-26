import { beforeEach, describe, expect, it, vi } from "vitest";
import { UnauthenticatedError } from "./errors";

const mockSignOut = vi.fn();
const mockClient = {
	auth: {
		signOut: mockSignOut,
	},
};

import { signOut } from "./signOut";

beforeEach(() => {
	vi.clearAllMocks();
});

describe("signOut", () => {
	it("should successfully sign out", async () => {
		mockSignOut.mockResolvedValue({
			error: null,
		});

		await expect(
			signOut({ client: mockClient as any }),
		).resolves.toBeUndefined();
		expect(mockSignOut).toHaveBeenCalledWith();
	});

	it("should throw UnauthenticatedError when sign out fails", async () => {
		mockSignOut.mockResolvedValue({
			error: { message: "Sign out failed" },
		});

		await expect(signOut({ client: mockClient as any })).rejects.toThrow(
			UnauthenticatedError,
		);
	});

	it("should throw UnauthenticatedError on network errors", async () => {
		mockSignOut.mockResolvedValue({
			error: { message: "Network error", status: 500 },
		});

		await expect(signOut({ client: mockClient as any })).rejects.toThrow(
			UnauthenticatedError,
		);
	});
});
