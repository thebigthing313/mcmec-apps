import { describe, expect, it } from "vitest";
import {
	AuthError,
	ForbiddenError,
	NotOnboardedError,
	UnauthenticatedError,
} from "./errors";

describe("AuthError", () => {
	it("should have correct name, code, and message", () => {
		const error = new AuthError("test message", "TEST_CODE");
		expect(error).toBeInstanceOf(Error);
		expect(error.name).toBe("AuthError");
		expect(error.code).toBe("TEST_CODE");
		expect(error.message).toBe("test message");
	});
});

describe("UnauthenticatedError", () => {
	it("should have correct defaults", () => {
		const error = new UnauthenticatedError();
		expect(error).toBeInstanceOf(AuthError);
		expect(error).toBeInstanceOf(Error);
		expect(error.name).toBe("UnauthenticatedError");
		expect(error.code).toBe("UNAUTHENTICATED");
		expect(error.message).toBe(
			"You must be logged in to access this resource.",
		);
	});

	it("should accept a custom message", () => {
		const error = new UnauthenticatedError("Custom message");
		expect(error.message).toBe("Custom message");
		expect(error.code).toBe("UNAUTHENTICATED");
	});
});

describe("ForbiddenError", () => {
	it("should have correct defaults", () => {
		const error = new ForbiddenError();
		expect(error).toBeInstanceOf(AuthError);
		expect(error.name).toBe("ForbiddenError");
		expect(error.code).toBe("FORBIDDEN");
		expect(error.message).toBe(
			"You do not have permission to this action or resource.",
		);
	});
});

describe("NotOnboardedError", () => {
	it("should have correct defaults", () => {
		const error = new NotOnboardedError();
		expect(error).toBeInstanceOf(AuthError);
		expect(error.name).toBe("NotOnboardedError");
		expect(error.code).toBe("NOT_ONBOARDED");
		expect(error.message).toBe("User has not properly onboarded.");
	});
});
