import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSignOut = vi.fn();

vi.mock("../client", () => {
	return {
		createClient: vi.fn(() => ({
			auth: {
				signOut: mockSignOut,
			},
		})),
	};
});

import { createClient } from "../client";
import { signOut as signOutFn } from "./signOut";

beforeEach(() => {
	vi.clearAllMocks();
});

describe("signOut", () => {
	const validInput = {
		supabaseUrl: "https://example.supabase.co",
		supabaseKey: "test-key",
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

	it("should call createClient with correct parameters", async () => {
		mockSignOut.mockResolvedValue({
			error: null,
		});

		await signOutFn(validInput);

		expect(createClient).toHaveBeenCalledWith(
			"https://example.supabase.co",
			"test-key",
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
