import { beforeEach, describe, expect, it, vi } from "vitest";
import { UnauthenticatedError } from "./errors";

const mockEmailSignIn = vi.fn();
const mockClient = {
	signIn: {
		email: mockEmailSignIn,
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
		// biome-ignore lint/suspicious/noExplicitAny: structural mock of the Better Auth client
		client: mockClient as any,
	};

	it("should successfully sign in with valid credentials", async () => {
		mockEmailSignIn.mockResolvedValue({
			data: {
				user: {
					id: "123e4567-e89b-12d3-a456-426614174000",
					email: "user@example.com",
				},
				token: "mock-session-token",
			},
			error: null,
		});

		await expect(signIn(validInput)).resolves.toBeUndefined();

		expect(mockEmailSignIn).toHaveBeenCalledWith({
			email: "user@example.com",
			password: "securepassword123",
		});
	});

	it("should throw UnauthenticatedError when authentication fails", async () => {
		mockEmailSignIn.mockResolvedValue({
			data: null,
			error: { message: "Invalid credentials", status: 401 },
		});

		await expect(signIn(validInput)).rejects.toThrow(UnauthenticatedError);
	});

	it("should throw UnauthenticatedError when no data is returned", async () => {
		mockEmailSignIn.mockResolvedValue({
			data: null,
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
		mockEmailSignIn.mockResolvedValue({
			data: {
				user: {
					id: "123e4567-e89b-12d3-a456-426614174000",
					email: "user@example.com",
				},
				token: "mock-session-token",
			},
			error: null,
		});

		await expect(
			signIn({ ...validInput, password: "abcdef" }),
		).resolves.toBeUndefined();
	});
});
