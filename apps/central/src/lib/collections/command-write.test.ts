import { toastOnError } from "@mcmec/ui/lib/toast-on-error";
import { toast } from "sonner";
import { afterEach, describe, expect, it, vi } from "vitest";
import { sendCommand } from "./command-write";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

afterEach(() => {
	vi.unstubAllGlobals();
	vi.clearAllMocks();
});

/** A refusal as the command endpoint sends one: a 409 whose `message` is written for the user. */
async function refusal(message: string): Promise<unknown> {
	vi.stubGlobal(
		"fetch",
		vi.fn(
			async () =>
				new Response(JSON.stringify({ error: "too_soon", message }), {
					status: 409,
				}),
		),
	);
	return sendCommand("https://api.test", {
		id: "n1",
		intents: ["publishNotice"],
	}).catch((error: unknown) => error);
}

/**
 * `toastOnError` lives in `@mcmec/ui`, which cannot import central, so it knows a refusal only
 * by the name `CommandRefusedError` (#278). This is the one place the two meet: rename the class's
 * `name` here or the string ui matches, and the user gets the generic fallback instead of the
 * server's sentence — which fails these tests rather than nothing at all.
 */
describe("a refusal from sendCommand, through toastOnError", () => {
	const sentence = "This notice was posted 3 days ago; the law requires seven.";

	it("shows the server's sentence, not the fallback", async () => {
		const error = await refusal(sentence);

		toastOnError(
			{ isPersisted: { promise: Promise.reject(error) } },
			"Fallback.",
		);

		await vi.waitFor(() => expect(toast.error).toHaveBeenCalledWith(sentence));
	});

	it("still finds it once the collection has wrapped it in a cause", async () => {
		const wrapped = new Error("transaction failed", {
			cause: await refusal(sentence),
		});

		toastOnError(
			{ isPersisted: { promise: Promise.reject(wrapped) } },
			"Fallback.",
		);

		await vi.waitFor(() => expect(toast.error).toHaveBeenCalledWith(sentence));
	});
});
