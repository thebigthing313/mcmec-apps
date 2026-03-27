import { beforeEach, describe, expect, it, vi } from "vitest";
import { UnauthenticatedError } from "./errors";

const mockSignInWithPassword = vi.fn();
const mockClient = {
	auth: {
		signInWithPassword: mockSignInWithPassword,
	},
};

import { signIn } from "./signIn";

beforeEach(() => {
	vi.clearAllMocks();
});

describe("signIn", () => {
	const validInput = {
		email: "user@example.com",
		password: "securepassword123",
		client: mockClient as any,
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

		await expect(signIn(validInput)).resolves.toBeUndefined();

		expect(mockSignInWithPassword).toHaveBeenCalledWith({
			email: "user@example.com",
			password: "securepassword123",
		});
	});

	it("should throw UnauthenticatedError when authentication fails", async () => {
		mockSignInWithPassword.mockResolvedValue({
			data: { user: null, session: null },
			error: { message: "Invalid credentials" },
		});

		await expect(signIn(validInput)).rejects.toThrow(UnauthenticatedError);
	});

	it("should throw UnauthenticatedError when user is missing from response", async () => {
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

		await expect(signIn(validInput)).rejects.toThrow(UnauthenticatedError);
	});

	it("should throw UnauthenticatedError when session is missing from response", async () => {
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

		await expect(signIn(validInput)).rejects.toThrow(UnauthenticatedError);
	});

	it("should throw error for invalid email format", async () => {
		const invalidInput = {
			...validInput,
			email: "not-an-email",
		};

		await expect(signIn(invalidInput)).rejects.toThrow();
	});

	it("should throw error for password shorter than 6 characters", async () => {
		const invalidInput = {
			...validInput,
			password: "short",
		};

		await expect(signIn(invalidInput)).rejects.toThrow();
	});

	it("should accept a 6-character password", async () => {
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

		await expect(
			signIn({ ...validInput, password: "abcdef" }),
		).resolves.toBeUndefined();
	});
});
