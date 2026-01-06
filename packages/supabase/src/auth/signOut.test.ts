import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSignOut = vi.fn();
const mockClient = {
	auth: {
		signOut: mockSignOut,
	},
};

import { signOut as signOutFn } from "./signOut";

beforeEach(() => {
	vi.clearAllMocks();
});

describe("signOut", () => {
	const validInput = {
		client: mockClient as any,
	};

	it("should successfully sign out", async () => {
		mockSignOut.mockResolvedValue({
			error: null,
		});

		const result = await signOutFn(validInput);

		expect(mockSignOut).toHaveBeenCalledWith();
		expect(result).toEqual({ success: true });
	});

	it("should throw error when sign out fails", async () => {
		mockSignOut.mockResolvedValue({
			error: { message: "Sign out failed" },
		});

		await expect(signOutFn(validInput)).rejects.toThrow(
			"You must be logged in to access this resource.",
		);
	});

	it("should handle network errors during sign out", async () => {
		mockSignOut.mockResolvedValue({
			error: { message: "Network error", status: 500 },
		});

		await expect(signOutFn(validInput)).rejects.toThrow(
			"You must be logged in to access this resource.",
		);
	});

	it("should handle timeout errors", async () => {
		mockSignOut.mockResolvedValue({
			error: { message: "Request timeout" },
		});

		await expect(signOutFn(validInput)).rejects.toThrow();
	});
});
