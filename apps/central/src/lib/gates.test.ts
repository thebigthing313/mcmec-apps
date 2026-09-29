import { ForbiddenError, NoEmployeeError } from "@mcmec/auth/errors";
import type { Claims } from "@mcmec/auth/types";
import { describe, expect, it } from "vitest";
import { requireAppRole, requireEmployee } from "./gates";

function claims(overrides: Partial<Claims> = {}): Claims {
	return {
		employeeId: "123e4567-e89b-12d3-a456-426614174002",
		permissions: [],
		userEmail: "user@example.com",
		userId: "123e4567-e89b-12d3-a456-426614174000",
		...overrides,
	};
}

describe("requireEmployee", () => {
	it("refuses a User with no linked Employee", () => {
		expect(() => requireEmployee(claims({ employeeId: null }))).toThrow(
			NoEmployeeError,
		);
	});

	it("refuses a User with no linked Employee even when they hold App Roles", () => {
		// App Roles belong to the User, but every App reads the Employee: a role is no way in.
		expect(() =>
			requireEmployee(
				claims({ employeeId: null, permissions: ["manage_users"] }),
			),
		).toThrow(NoEmployeeError);
	});

	it("lets a User with a linked Employee through, with the claims unchanged", () => {
		const signedIn = claims({ permissions: ["manage_website"] });

		expect(requireEmployee(signedIn)).toEqual({
			employeeId: "123e4567-e89b-12d3-a456-426614174002",
			permissions: ["manage_website"],
			userEmail: "user@example.com",
			userId: "123e4567-e89b-12d3-a456-426614174000",
		});
	});
});

describe("requireAppRole", () => {
	it("refuses a User without the App Role", () => {
		expect(() =>
			requireAppRole(claims({ permissions: [] }), "manage_employees"),
		).toThrow(ForbiddenError);
	});

	it("refuses a User holding only other App Roles", () => {
		expect(() =>
			requireAppRole(
				claims({ permissions: ["manage_website", "manage_users"] }),
				"manage_employees",
			),
		).toThrow(ForbiddenError);
	});

	it("lets a User holding the App Role through", () => {
		expect(() =>
			requireAppRole(
				claims({ permissions: ["manage_website", "manage_employees"] }),
				"manage_employees",
			),
		).not.toThrow();
	});
});
