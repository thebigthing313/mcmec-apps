import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetClaims = vi.fn();

vi.mock("../client", () => {
	return {
		createClient: vi.fn(() => ({
			auth: {
				getClaims: mockGetClaims,
			},
		})),
	};
});

import { createClient } from "../client";
import { verifyClaims } from "./claims";

beforeEach(() => {
	vi.clearAllMocks();
});

describe("verifyClaims", () => {
	it("should return claims when all required fields are present", async () => {
		mockGetClaims.mockResolvedValue({
			data: {
				claims: {
					sub: "123e4567-e89b-12d3-a456-426614174000",
					email: "user@example.com",
					app_metadata: {
						profile_id: "123e4567-e89b-12d3-a456-426614174001",
						employee_id: "123e4567-e89b-12d3-a456-426614174002",
						permissions: ["read"],
					},
				},
			},
			error: null,
		});

		const result = await verifyClaims({
			supabaseUrl: "url",
			supabaseKey: "key",
		});

		expect(result).toEqual({
			userId: "123e4567-e89b-12d3-a456-426614174000",
			userEmail: "user@example.com",
			profileId: "123e4567-e89b-12d3-a456-426614174001",
			employeeId: "123e4567-e89b-12d3-a456-426614174002",
			permissions: ["read"],
		});
	});

	it("should throw INVALID_JWT when profileId is missing", async () => {
		mockGetClaims.mockResolvedValue({
			data: {
				claims: {
					sub: "123e4567-e89b-12d3-a456-426614174000",
					email: "user@example.com",
					app_metadata: {
						employee_id: "123e4567-e89b-12d3-a456-426614174002",
						permissions: [],
					},
				},
			},
			error: null,
		});

		await expect(
			verifyClaims({ supabaseUrl: "url", supabaseKey: "key" }),
		).rejects.toThrow("The provided authentication token is invalid.");
	});

	it("should throw INVALID_JWT when employeeId is missing", async () => {
		mockGetClaims.mockResolvedValue({
			data: {
				claims: {
					sub: "123e4567-e89b-12d3-a456-426614174000",
					email: "user@example.com",
					app_metadata: {
						profile_id: "123e4567-e89b-12d3-a456-426614174001",
						permissions: [],
					},
				},
			},
			error: null,
		});

		await expect(
			verifyClaims({ supabaseUrl: "url", supabaseKey: "key" }),
		).rejects.toThrow("The provided authentication token is invalid.");
	});

	it("should throw FORBIDDEN when permission is required but not present", async () => {
		mockGetClaims.mockResolvedValue({
			data: {
				claims: {
					sub: "123e4567-e89b-12d3-a456-426614174000",
					email: "user@example.com",
					app_metadata: {
						profile_id: "123e4567-e89b-12d3-a456-426614174001",
						employee_id: "123e4567-e89b-12d3-a456-426614174002",
						permissions: ["read"],
					},
				},
			},
			error: null,
		});

		await expect(
			verifyClaims({
				supabaseUrl: "url",
				supabaseKey: "key",
				permission: "write",
			}),
		).rejects.toThrow("You do not have permission to this action or resource.");
	});

	it("should return claims when permission is present", async () => {
		mockGetClaims.mockResolvedValue({
			data: {
				claims: {
					sub: "123e4567-e89b-12d3-a456-426614174000",
					email: "user@example.com",
					app_metadata: {
						profile_id: "123e4567-e89b-12d3-a456-426614174001",
						employee_id: "123e4567-e89b-12d3-a456-426614174002",
						permissions: ["read", "write"],
					},
				},
			},
			error: null,
		});

		const result = await verifyClaims({
			supabaseUrl: "url",
			supabaseKey: "key",
			permission: "write",
		});

		expect(result.permissions).toContain("write");
	});

	it("should throw INVALID_JWT when getClaims returns no data", async () => {
		mockGetClaims.mockResolvedValue({
			data: null,
			error: null,
		});

		await expect(
			verifyClaims({ supabaseUrl: "url", supabaseKey: "key" }),
		).rejects.toThrow("The provided authentication token is invalid.");
	});

	it("should throw UNABLE_TO_FETCH_CLAIMS when getClaims returns an error", async () => {
		mockGetClaims.mockResolvedValue({
			data: null,
			error: { message: "Network error", status: 500 },
		});

		await expect(
			verifyClaims({ supabaseUrl: "url", supabaseKey: "key" }),
		).rejects.toThrow();
	});

	it("should throw INVALID_JWT when claims data is undefined", async () => {
		mockGetClaims.mockResolvedValue({
			data: undefined,
			error: null,
		});

		await expect(
			verifyClaims({ supabaseUrl: "url", supabaseKey: "key" }),
		).rejects.toThrow("The provided authentication token is invalid.");
	});

	it("should throw validation error when userId is not a valid UUID", async () => {
		mockGetClaims.mockResolvedValue({
			data: {
				claims: {
					sub: "invalid-uuid",
					email: "user@example.com",
					app_metadata: {
						profile_id: "123e4567-e89b-12d3-a456-426614174001",
						employee_id: "123e4567-e89b-12d3-a456-426614174002",
						permissions: [],
					},
				},
			},
			error: null,
		});

		await expect(
			verifyClaims({ supabaseUrl: "url", supabaseKey: "key" }),
		).rejects.toThrow();
	});

	it("should throw validation error when email is invalid", async () => {
		mockGetClaims.mockResolvedValue({
			data: {
				claims: {
					sub: "123e4567-e89b-12d3-a456-426614174000",
					email: "not-an-email",
					app_metadata: {
						profile_id: "123e4567-e89b-12d3-a456-426614174001",
						employee_id: "123e4567-e89b-12d3-a456-426614174002",
						permissions: [],
					},
				},
			},
			error: null,
		});

		await expect(
			verifyClaims({ supabaseUrl: "url", supabaseKey: "key" }),
		).rejects.toThrow();
	});

	it("should throw validation error when profileId is not a valid UUID", async () => {
		mockGetClaims.mockResolvedValue({
			data: {
				claims: {
					sub: "123e4567-e89b-12d3-a456-426614174000",
					email: "user@example.com",
					app_metadata: {
						profile_id: "invalid-uuid",
						employee_id: "123e4567-e89b-12d3-a456-426614174002",
						permissions: [],
					},
				},
			},
			error: null,
		});

		await expect(
			verifyClaims({ supabaseUrl: "url", supabaseKey: "key" }),
		).rejects.toThrow();
	});

	it("should throw validation error when employeeId is not a valid UUID", async () => {
		mockGetClaims.mockResolvedValue({
			data: {
				claims: {
					sub: "123e4567-e89b-12d3-a456-426614174000",
					email: "user@example.com",
					app_metadata: {
						profile_id: "123e4567-e89b-12d3-a456-426614174001",
						employee_id: "not-a-uuid",
						permissions: [],
					},
				},
			},
			error: null,
		});

		await expect(
			verifyClaims({ supabaseUrl: "url", supabaseKey: "key" }),
		).rejects.toThrow();
	});

	it("should handle empty string profileId as invalid", async () => {
		mockGetClaims.mockResolvedValue({
			data: {
				claims: {
					sub: "123e4567-e89b-12d3-a456-426614174000",
					email: "user@example.com",
					app_metadata: {
						profile_id: "",
						employee_id: "123e4567-e89b-12d3-a456-426614174002",
						permissions: [],
					},
				},
			},
			error: null,
		});

		await expect(
			verifyClaims({ supabaseUrl: "url", supabaseKey: "key" }),
		).rejects.toThrow();
	});

	it("should handle empty string employeeId as invalid", async () => {
		mockGetClaims.mockResolvedValue({
			data: {
				claims: {
					sub: "123e4567-e89b-12d3-a456-426614174000",
					email: "user@example.com",
					app_metadata: {
						profile_id: "123e4567-e89b-12d3-a456-426614174001",
						employee_id: "",
						permissions: [],
					},
				},
			},
			error: null,
		});

		await expect(
			verifyClaims({ supabaseUrl: "url", supabaseKey: "key" }),
		).rejects.toThrow();
	});

	it("should handle when app_metadata is null", async () => {
		mockGetClaims.mockResolvedValue({
			data: {
				claims: {
					sub: "123e4567-e89b-12d3-a456-426614174000",
					email: "user@example.com",
					app_metadata: null,
				},
			},
			error: null,
		});

		await expect(
			verifyClaims({ supabaseUrl: "url", supabaseKey: "key" }),
		).rejects.toThrow("The provided authentication token is invalid.");
	});

	it("should handle when app_metadata is undefined", async () => {
		mockGetClaims.mockResolvedValue({
			data: {
				claims: {
					sub: "123e4567-e89b-12d3-a456-426614174000",
					email: "user@example.com",
				},
			},
			error: null,
		});

		await expect(
			verifyClaims({ supabaseUrl: "url", supabaseKey: "key" }),
		).rejects.toThrow("The provided authentication token is invalid.");
	});

	it("should handle when permissions is not an array", async () => {
		mockGetClaims.mockResolvedValue({
			data: {
				claims: {
					sub: "123e4567-e89b-12d3-a456-426614174000",
					email: "user@example.com",
					app_metadata: {
						profile_id: "123e4567-e89b-12d3-a456-426614174001",
						employee_id: "123e4567-e89b-12d3-a456-426614174002",
						permissions: "not-an-array",
					},
				},
			},
			error: null,
		});

		const result = await verifyClaims({
			supabaseUrl: "url",
			supabaseKey: "key",
		});

		// Should default to empty array when permissions is not an array
		expect(result.permissions).toEqual([]);
	});

	it("should handle when permissions is missing from app_metadata", async () => {
		mockGetClaims.mockResolvedValue({
			data: {
				claims: {
					sub: "123e4567-e89b-12d3-a456-426614174000",
					email: "user@example.com",
					app_metadata: {
						profile_id: "123e4567-e89b-12d3-a456-426614174001",
						employee_id: "123e4567-e89b-12d3-a456-426614174002",
					},
				},
			},
			error: null,
		});

		const result = await verifyClaims({
			supabaseUrl: "url",
			supabaseKey: "key",
		});

		// Should default to empty array when permissions is missing
		expect(result.permissions).toEqual([]);
	});

	it("should return claims with empty permissions array when no permission check is needed", async () => {
		mockGetClaims.mockResolvedValue({
			data: {
				claims: {
					sub: "123e4567-e89b-12d3-a456-426614174000",
					email: "user@example.com",
					app_metadata: {
						profile_id: "123e4567-e89b-12d3-a456-426614174001",
						employee_id: "123e4567-e89b-12d3-a456-426614174002",
						permissions: [],
					},
				},
			},
			error: null,
		});

		const result = await verifyClaims({
			supabaseUrl: "url",
			supabaseKey: "key",
		});

		expect(result.permissions).toEqual([]);
		expect(result.userId).toBe("123e4567-e89b-12d3-a456-426614174000");
	});

	it("should handle when profileId is a number instead of string", async () => {
		mockGetClaims.mockResolvedValue({
			data: {
				claims: {
					sub: "123e4567-e89b-12d3-a456-426614174000",
					email: "user@example.com",
					app_metadata: {
						profile_id: 12345,
						employee_id: "123e4567-e89b-12d3-a456-426614174002",
						permissions: [],
					},
				},
			},
			error: null,
		});

		await expect(
			verifyClaims({ supabaseUrl: "url", supabaseKey: "key" }),
		).rejects.toThrow("The provided authentication token is invalid.");
	});

	it("should handle when employeeId is a number instead of string", async () => {
		mockGetClaims.mockResolvedValue({
			data: {
				claims: {
					sub: "123e4567-e89b-12d3-a456-426614174000",
					email: "user@example.com",
					app_metadata: {
						profile_id: "123e4567-e89b-12d3-a456-426614174001",
						employee_id: 12345,
						permissions: [],
					},
				},
			},
			error: null,
		});

		await expect(
			verifyClaims({ supabaseUrl: "url", supabaseKey: "key" }),
		).rejects.toThrow("The provided authentication token is invalid.");
	});

	it("should verify createClient is called with correct parameters", async () => {
		const mockCreateClient = vi.mocked(createClient);

		mockGetClaims.mockResolvedValue({
			data: {
				claims: {
					sub: "123e4567-e89b-12d3-a456-426614174000",
					email: "user@example.com",
					app_metadata: {
						profile_id: "123e4567-e89b-12d3-a456-426614174001",
						employee_id: "123e4567-e89b-12d3-a456-426614174002",
						permissions: [],
					},
				},
			},
			error: null,
		});

		await verifyClaims({
			supabaseUrl: "https://test.supabase.co",
			supabaseKey: "test-key-123",
		});

		expect(mockCreateClient).toHaveBeenCalledWith(
			"https://test.supabase.co",
			"test-key-123",
		);
	});

	it("should handle multiple permissions correctly", async () => {
		mockGetClaims.mockResolvedValue({
			data: {
				claims: {
					sub: "123e4567-e89b-12d3-a456-426614174000",
					email: "user@example.com",
					app_metadata: {
						profile_id: "123e4567-e89b-12d3-a456-426614174001",
						employee_id: "123e4567-e89b-12d3-a456-426614174002",
						permissions: ["read", "write", "delete", "admin"],
					},
				},
			},
			error: null,
		});

		const result = await verifyClaims({
			supabaseUrl: "url",
			supabaseKey: "key",
			permission: "delete",
		});

		expect(result.permissions).toEqual(["read", "write", "delete", "admin"]);
		expect(result.permissions).toContain("delete");
	});

	it("should be case-sensitive when checking permissions", async () => {
		mockGetClaims.mockResolvedValue({
			data: {
				claims: {
					sub: "123e4567-e89b-12d3-a456-426614174000",
					email: "user@example.com",
					app_metadata: {
						profile_id: "123e4567-e89b-12d3-a456-426614174001",
						employee_id: "123e4567-e89b-12d3-a456-426614174002",
						permissions: ["Read"],
					},
				},
			},
			error: null,
		});

		await expect(
			verifyClaims({
				supabaseUrl: "url",
				supabaseKey: "key",
				permission: "read",
			}),
		).rejects.toThrow("You do not have permission to this action or resource.");
	});
});
