import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSignInWithPassword = vi.fn();

vi.mock("../client", () => {
	return {
		createClient: vi.fn(() => ({
			auth: {
				signInWithPassword: mockSignInWithPassword,
			},
		})),
	};
});

import { createClient } from "../client";
import { signIn } from "./signIn";

beforeEach(() => {
	vi.clearAllMocks();
});

describe("signIn", () => {
	const validInput = {
		email: "user@example.com",
		password: "securepassword123",
		supabaseUrl: "https://example.supabase.co",
		supabaseKey: "test-key",
	};

	it("should successfully sign in with valid credentials", async () => {
		mockSignInWithPassword.mockResolvedValue({
			data: {
				user: {
					id: "123e4567-e89b-12d3-a456-426614174000",
					email: "user@example.com",
				},
				session: {
					access_token: "mock-access-token",
					refresh_token: "mock-refresh-token",
				},
			},
			error: null,
		});

		const result = await signIn(validInput);

		expect(mockSignInWithPassword).toHaveBeenCalledWith({
			email: "user@example.com",
			password: "securepassword123",
		});

		expect(result).toEqual({
			userId: "123e4567-e89b-12d3-a456-426614174000",
			email: "user@example.com",
			accessToken: "mock-access-token",
			refreshToken: "mock-refresh-token",
		});
	});

	it("should throw error when authentication fails", async () => {
		mockSignInWithPassword.mockResolvedValue({
			data: { user: null, session: null },
			error: { message: "Invalid credentials" },
		});

		await expect(signIn(validInput)).rejects.toThrow(
			"You must be logged in to access this resource.",
		);
	});

	it("should throw error when user is missing from response", async () => {
		mockSignInWithPassword.mockResolvedValue({
			data: {
				user: null,
				session: {
					access_token: "mock-access-token",
					refresh_token: "mock-refresh-token",
				},
			},
			error: null,
		});

		await expect(signIn(validInput)).rejects.toThrow(
			"You must be logged in to access this resource.",
		);
	});

	it("should throw error when session is missing from response", async () => {
		mockSignInWithPassword.mockResolvedValue({
			data: {
				user: {
					id: "123e4567-e89b-12d3-a456-426614174000",
					email: "user@example.com",
				},
				session: null,
			},
			error: null,
		});

		await expect(signIn(validInput)).rejects.toThrow(
			"You must be logged in to access this resource.",
		);
	});

	it("should throw error for invalid email format", async () => {
		const invalidInput = {
			...validInput,
			email: "not-an-email",
		};

		await expect(signIn(invalidInput)).rejects.toThrow();
	});

	it("should throw error for password shorter than 8 characters", async () => {
		const invalidInput = {
			...validInput,
			password: "short",
		};

		await expect(signIn(invalidInput)).rejects.toThrow();
	});

	it("should call createClient with correct parameters", async () => {
		mockSignInWithPassword.mockResolvedValue({
			data: {
				user: {
					id: "123e4567-e89b-12d3-a456-426614174000",
					email: "user@example.com",
				},
				session: {
					access_token: "mock-access-token",
					refresh_token: "mock-refresh-token",
				},
			},
			error: null,
		});

		await signIn(validInput);

		expect(createClient).toHaveBeenCalledWith(
			"https://example.supabase.co",
			"test-key",
		);
	});

	it("should handle missing email in user response", async () => {
		mockSignInWithPassword.mockResolvedValue({
			data: {
				user: {
					id: "123e4567-e89b-12d3-a456-426614174000",
					email: null,
				},
				session: {
					access_token: "mock-access-token",
					refresh_token: "mock-refresh-token",
				},
			},
			error: null,
		});

		await expect(signIn(validInput)).rejects.toThrow();
	});
});
