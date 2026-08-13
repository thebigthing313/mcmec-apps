import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	ForbiddenError,
	NotOnboardedError,
	UnauthenticatedError,
} from "./errors";

const mockGetSession = vi.fn();
const mockClient = {
	getSession: mockGetSession,
};

import { verifyClaims } from "./verifyClaims";

// Builds a Better Auth get-session payload (the shape our customSession returns).
function sessionPayload(overrides: {
	id?: unknown;
	email?: unknown;
	employeeId?: unknown;
	permissions?: unknown;
}) {
	return {
		data: {
			user: {
				id: overrides.id,
				email: overrides.email,
			},
			session: { id: "session-id" },
			employeeId: overrides.employeeId,
			permissions: overrides.permissions,
		},
		error: null,
	};
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe("verifyClaims", () => {
	it("should return claims when all required fields are present", async () => {
		mockGetSession.mockResolvedValue(
			sessionPayload({
				id: "123e4567-e89b-12d3-a456-426614174000",
				email: "user@example.com",
				employeeId: "123e4567-e89b-12d3-a456-426614174002",
				permissions: ["read"],
			}),
		);

		// biome-ignore lint/suspicious/noExplicitAny: structural mock of the Better Auth client
		const result = await verifyClaims({ client: mockClient as any });

		expect(result).toEqual({
			userId: "123e4567-e89b-12d3-a456-426614174000",
			userEmail: "user@example.com",
			employeeId: "123e4567-e89b-12d3-a456-426614174002",
			permissions: ["read"],
		});
	});

	it("should throw NotOnboardedError when employeeId is null", async () => {
		mockGetSession.mockResolvedValue(
			sessionPayload({
				id: "123e4567-e89b-12d3-a456-426614174000",
				email: "user@example.com",
				employeeId: null,
				permissions: [],
			}),
		);

		await expect(
			// biome-ignore lint/suspicious/noExplicitAny: structural mock
			verifyClaims({ client: mockClient as any }),
		).rejects.toThrow(NotOnboardedError);
	});

	it("should throw ForbiddenError when permission is required but not present", async () => {
		mockGetSession.mockResolvedValue(
			sessionPayload({
				id: "123e4567-e89b-12d3-a456-426614174000",
				email: "user@example.com",
				employeeId: "123e4567-e89b-12d3-a456-426614174002",
				permissions: ["read"],
			}),
		);

		await expect(
			// biome-ignore lint/suspicious/noExplicitAny: structural mock
			verifyClaims({ client: mockClient as any, permission: "write" }),
		).rejects.toThrow(ForbiddenError);
	});

	it("should return claims when permission is present", async () => {
		mockGetSession.mockResolvedValue(
			sessionPayload({
				id: "123e4567-e89b-12d3-a456-426614174000",
				email: "user@example.com",
				employeeId: "123e4567-e89b-12d3-a456-426614174002",
				permissions: ["read", "write"],
			}),
		);

		const result = await verifyClaims({
			// biome-ignore lint/suspicious/noExplicitAny: structural mock
			client: mockClient as any,
			permission: "write",
		});

		expect(result.permissions).toContain("write");
	});

	it("should throw UnauthenticatedError when getSession returns no data", async () => {
		mockGetSession.mockResolvedValue({ data: null, error: null });

		await expect(
			// biome-ignore lint/suspicious/noExplicitAny: structural mock
			verifyClaims({ client: mockClient as any }),
		).rejects.toThrow(UnauthenticatedError);
	});

	it("should throw UnauthenticatedError when getSession returns an error", async () => {
		mockGetSession.mockResolvedValue({
			data: null,
			error: { message: "Network error", status: 500 },
		});

		await expect(
			// biome-ignore lint/suspicious/noExplicitAny: structural mock
			verifyClaims({ client: mockClient as any }),
		).rejects.toThrow(UnauthenticatedError);
	});

	it("should throw UnauthenticatedError when data is undefined", async () => {
		mockGetSession.mockResolvedValue({ data: undefined, error: null });

		await expect(
			// biome-ignore lint/suspicious/noExplicitAny: structural mock
			verifyClaims({ client: mockClient as any }),
		).rejects.toThrow(UnauthenticatedError);
	});

	it("should throw validation error when userId is not a valid UUID", async () => {
		mockGetSession.mockResolvedValue(
			sessionPayload({
				id: "invalid-uuid",
				email: "user@example.com",
				employeeId: "123e4567-e89b-12d3-a456-426614174002",
				permissions: [],
			}),
		);

		await expect(
			// biome-ignore lint/suspicious/noExplicitAny: structural mock
			verifyClaims({ client: mockClient as any }),
		).rejects.toThrow();
	});

	it("should throw validation error when email is invalid", async () => {
		mockGetSession.mockResolvedValue(
			sessionPayload({
				id: "123e4567-e89b-12d3-a456-426614174000",
				email: "not-an-email",
				employeeId: "123e4567-e89b-12d3-a456-426614174002",
				permissions: [],
			}),
		);

		await expect(
			// biome-ignore lint/suspicious/noExplicitAny: structural mock
			verifyClaims({ client: mockClient as any }),
		).rejects.toThrow();
	});

	it("should throw validation error when employeeId is not a valid UUID", async () => {
		mockGetSession.mockResolvedValue(
			sessionPayload({
				id: "123e4567-e89b-12d3-a456-426614174000",
				email: "user@example.com",
				employeeId: "not-a-uuid",
				permissions: [],
			}),
		);

		await expect(
			// biome-ignore lint/suspicious/noExplicitAny: structural mock
			verifyClaims({ client: mockClient as any }),
		).rejects.toThrow();
	});

	it("should handle empty string employeeId as invalid", async () => {
		mockGetSession.mockResolvedValue(
			sessionPayload({
				id: "123e4567-e89b-12d3-a456-426614174000",
				email: "user@example.com",
				employeeId: "",
				permissions: [],
			}),
		);

		await expect(
			// biome-ignore lint/suspicious/noExplicitAny: structural mock
			verifyClaims({ client: mockClient as any }),
		).rejects.toThrow();
	});

	it("should treat non-string employeeId as null and throw NotOnboardedError", async () => {
		mockGetSession.mockResolvedValue(
			sessionPayload({
				id: "123e4567-e89b-12d3-a456-426614174000",
				email: "user@example.com",
				employeeId: 12345,
				permissions: [],
			}),
		);

		await expect(
			// biome-ignore lint/suspicious/noExplicitAny: structural mock
			verifyClaims({ client: mockClient as any }),
		).rejects.toThrow(NotOnboardedError);
	});

	it("should coerce non-array permissions to an empty array", async () => {
		mockGetSession.mockResolvedValue(
			sessionPayload({
				id: "123e4567-e89b-12d3-a456-426614174000",
				email: "user@example.com",
				employeeId: "123e4567-e89b-12d3-a456-426614174002",
				permissions: "not-an-array",
			}),
		);

		// biome-ignore lint/suspicious/noExplicitAny: structural mock
		const result = await verifyClaims({ client: mockClient as any });
		expect(result.permissions).toEqual([]);
	});

	it("should coerce missing permissions to an empty array", async () => {
		mockGetSession.mockResolvedValue(
			sessionPayload({
				id: "123e4567-e89b-12d3-a456-426614174000",
				email: "user@example.com",
				employeeId: "123e4567-e89b-12d3-a456-426614174002",
				permissions: undefined,
			}),
		);

		// biome-ignore lint/suspicious/noExplicitAny: structural mock
		const result = await verifyClaims({ client: mockClient as any });
		expect(result.permissions).toEqual([]);
	});

	it("should return claims with empty permissions when no permission check is needed", async () => {
		mockGetSession.mockResolvedValue(
			sessionPayload({
				id: "123e4567-e89b-12d3-a456-426614174000",
				email: "user@example.com",
				employeeId: "123e4567-e89b-12d3-a456-426614174002",
				permissions: [],
			}),
		);

		// biome-ignore lint/suspicious/noExplicitAny: structural mock
		const result = await verifyClaims({ client: mockClient as any });
		expect(result.permissions).toEqual([]);
		expect(result.userId).toBe("123e4567-e89b-12d3-a456-426614174000");
	});

	it("should handle multiple permissions correctly", async () => {
		mockGetSession.mockResolvedValue(
			sessionPayload({
				id: "123e4567-e89b-12d3-a456-426614174000",
				email: "user@example.com",
				employeeId: "123e4567-e89b-12d3-a456-426614174002",
				permissions: ["read", "write", "delete", "admin"],
			}),
		);

		const result = await verifyClaims({
			// biome-ignore lint/suspicious/noExplicitAny: structural mock
			client: mockClient as any,
			permission: "delete",
		});

		expect(result.permissions).toEqual(["read", "write", "delete", "admin"]);
		expect(result.permissions).toContain("delete");
	});

	it("should be case-sensitive when checking permissions", async () => {
		mockGetSession.mockResolvedValue(
			sessionPayload({
				id: "123e4567-e89b-12d3-a456-426614174000",
				email: "user@example.com",
				employeeId: "123e4567-e89b-12d3-a456-426614174002",
				permissions: ["Read"],
			}),
		);

		await expect(
			// biome-ignore lint/suspicious/noExplicitAny: structural mock
			verifyClaims({ client: mockClient as any, permission: "read" }),
		).rejects.toThrow(ForbiddenError);
	});
});
