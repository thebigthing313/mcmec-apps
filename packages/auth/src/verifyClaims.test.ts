import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	ForbiddenError,
	NotOnboardedError,
	UnauthenticatedError,
} from "./errors";

const mockGetClaims = vi.fn();
const mockClient = {
	auth: {
		getClaims: mockGetClaims,
	},
};

import { verifyClaims } from "./verifyClaims";

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
						employee_id: "123e4567-e89b-12d3-a456-426614174002",
						permissions: ["read"],
					},
				},
			},
			error: null,
		});

		const result = await verifyClaims({ client: mockClient as any });

		expect(result).toEqual({
			userId: "123e4567-e89b-12d3-a456-426614174000",
			userEmail: "user@example.com",
			employeeId: "123e4567-e89b-12d3-a456-426614174002",
			permissions: ["read"],
		});
	});

	it("should throw NotOnboardedError when employeeId is missing", async () => {
		mockGetClaims.mockResolvedValue({
			data: {
				claims: {
					sub: "123e4567-e89b-12d3-a456-426614174000",
					email: "user@example.com",
					app_metadata: {
						permissions: [],
					},
				},
			},
			error: null,
		});

		await expect(verifyClaims({ client: mockClient as any })).rejects.toThrow(
			NotOnboardedError,
		);
	});

	it("should throw ForbiddenError when permission is required but not present", async () => {
		mockGetClaims.mockResolvedValue({
			data: {
				claims: {
					sub: "123e4567-e89b-12d3-a456-426614174000",
					email: "user@example.com",
					app_metadata: {
						employee_id: "123e4567-e89b-12d3-a456-426614174002",
						permissions: ["read"],
					},
				},
			},
			error: null,
		});

		await expect(
			verifyClaims({ client: mockClient as any, permission: "write" }),
		).rejects.toThrow(ForbiddenError);
	});

	it("should return claims when permission is present", async () => {
		mockGetClaims.mockResolvedValue({
			data: {
				claims: {
					sub: "123e4567-e89b-12d3-a456-426614174000",
					email: "user@example.com",
					app_metadata: {
						employee_id: "123e4567-e89b-12d3-a456-426614174002",
						permissions: ["read", "write"],
					},
				},
			},
			error: null,
		});

		const result = await verifyClaims({
			client: mockClient as any,
			permission: "write",
		});

		expect(result.permissions).toContain("write");
	});

	it("should throw UnauthenticatedError when getClaims returns no data", async () => {
		mockGetClaims.mockResolvedValue({
			data: null,
			error: null,
		});

		await expect(verifyClaims({ client: mockClient as any })).rejects.toThrow(
			UnauthenticatedError,
		);
	});

	it("should throw UnauthenticatedError when getClaims returns an error", async () => {
		mockGetClaims.mockResolvedValue({
			data: null,
			error: { message: "Network error", status: 500 },
		});

		await expect(verifyClaims({ client: mockClient as any })).rejects.toThrow(
			UnauthenticatedError,
		);
	});

	it("should throw UnauthenticatedError when claims data is undefined", async () => {
		mockGetClaims.mockResolvedValue({
			data: undefined,
			error: null,
		});

		await expect(verifyClaims({ client: mockClient as any })).rejects.toThrow(
			UnauthenticatedError,
		);
	});

	it("should throw validation error when userId is not a valid UUID", async () => {
		mockGetClaims.mockResolvedValue({
			data: {
				claims: {
					sub: "invalid-uuid",
					email: "user@example.com",
					app_metadata: {
						employee_id: "123e4567-e89b-12d3-a456-426614174002",
						permissions: [],
					},
				},
			},
			error: null,
		});

		await expect(verifyClaims({ client: mockClient as any })).rejects.toThrow();
	});

	it("should throw validation error when email is invalid", async () => {
		mockGetClaims.mockResolvedValue({
			data: {
				claims: {
					sub: "123e4567-e89b-12d3-a456-426614174000",
					email: "not-an-email",
					app_metadata: {
						employee_id: "123e4567-e89b-12d3-a456-426614174002",
						permissions: [],
					},
				},
			},
			error: null,
		});

		await expect(verifyClaims({ client: mockClient as any })).rejects.toThrow();
	});

	it("should throw validation error when employeeId is not a valid UUID", async () => {
		mockGetClaims.mockResolvedValue({
			data: {
				claims: {
					sub: "123e4567-e89b-12d3-a456-426614174000",
					email: "user@example.com",
					app_metadata: {
						employee_id: "not-a-uuid",
						permissions: [],
					},
				},
			},
			error: null,
		});

		await expect(verifyClaims({ client: mockClient as any })).rejects.toThrow();
	});

	it("should handle empty string employeeId as invalid", async () => {
		mockGetClaims.mockResolvedValue({
			data: {
				claims: {
					sub: "123e4567-e89b-12d3-a456-426614174000",
					email: "user@example.com",
					app_metadata: {
						employee_id: "",
						permissions: [],
					},
				},
			},
			error: null,
		});

		await expect(verifyClaims({ client: mockClient as any })).rejects.toThrow();
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

		await expect(verifyClaims({ client: mockClient as any })).rejects.toThrow(
			NotOnboardedError,
		);
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

		await expect(verifyClaims({ client: mockClient as any })).rejects.toThrow(
			NotOnboardedError,
		);
	});

	it("should handle when permissions is not an array", async () => {
		mockGetClaims.mockResolvedValue({
			data: {
				claims: {
					sub: "123e4567-e89b-12d3-a456-426614174000",
					email: "user@example.com",
					app_metadata: {
						employee_id: "123e4567-e89b-12d3-a456-426614174002",
						permissions: "not-an-array",
					},
				},
			},
			error: null,
		});

		const result = await verifyClaims({ client: mockClient as any });
		expect(result.permissions).toEqual([]);
	});

	it("should handle when permissions is missing from app_metadata", async () => {
		mockGetClaims.mockResolvedValue({
			data: {
				claims: {
					sub: "123e4567-e89b-12d3-a456-426614174000",
					email: "user@example.com",
					app_metadata: {
						employee_id: "123e4567-e89b-12d3-a456-426614174002",
					},
				},
			},
			error: null,
		});

		const result = await verifyClaims({ client: mockClient as any });
		expect(result.permissions).toEqual([]);
	});

	it("should return claims with empty permissions when no permission check is needed", async () => {
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

		const result = await verifyClaims({ client: mockClient as any });
		expect(result.permissions).toEqual([]);
		expect(result.userId).toBe("123e4567-e89b-12d3-a456-426614174000");
	});

	it("should treat non-string employeeId as null and throw NotOnboardedError", async () => {
		mockGetClaims.mockResolvedValue({
			data: {
				claims: {
					sub: "123e4567-e89b-12d3-a456-426614174000",
					email: "user@example.com",
					app_metadata: {
						employee_id: 12345,
						permissions: [],
					},
				},
			},
			error: null,
		});

		await expect(verifyClaims({ client: mockClient as any })).rejects.toThrow(
			NotOnboardedError,
		);
	});

	it("should handle multiple permissions correctly", async () => {
		mockGetClaims.mockResolvedValue({
			data: {
				claims: {
					sub: "123e4567-e89b-12d3-a456-426614174000",
					email: "user@example.com",
					app_metadata: {
						employee_id: "123e4567-e89b-12d3-a456-426614174002",
						permissions: ["read", "write", "delete", "admin"],
					},
				},
			},
			error: null,
		});

		const result = await verifyClaims({
			client: mockClient as any,
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
						employee_id: "123e4567-e89b-12d3-a456-426614174002",
						permissions: ["Read"],
					},
				},
			},
			error: null,
		});

		await expect(
			verifyClaims({ client: mockClient as any, permission: "read" }),
		).rejects.toThrow(ForbiddenError);
	});
});
