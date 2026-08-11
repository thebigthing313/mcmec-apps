/**
 * Public intake — one server function for all four request types.
 *
 * Replaces the four Supabase-backed submit functions. The API's `POST /api/requests` owns
 * the whole thing now: honeypot, Turnstile verification, per-type validation, and the
 * insert. This forwards to it server-side, which keeps the browser talking only to its own
 * origin (no CORS, nothing added to the site's CSP) and keeps the Turnstile secret out of
 * this app entirely.
 */
import { PublicRequestSubmissionSchema } from "@mcmec/supabase/db/public-requests";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

const EnvelopeSchema = z.object({
	request: PublicRequestSubmissionSchema,
	turnstileToken: z.string().min(1),
	honeypot: z.string().optional(),
});

export type SubmitPublicRequestResult = {
	success: boolean;
	error?: string;
};

export const submitPublicRequestServerFn = createServerFn({ method: "POST" })
	.inputValidator(EnvelopeSchema)
	.handler(async ({ data }): Promise<SubmitPublicRequestResult> => {
		const apiUrl = process.env.API_URL;
		if (!apiUrl) {
			console.error("API_URL is not set — cannot submit public request.");
			return { error: "The form is unavailable right now.", success: false };
		}

		// Pass the visitor's IP through so Turnstile scores the real client, not this server.
		const request = getRequest();
		const remoteIp =
			request.headers.get("cf-connecting-ip") ||
			request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
			"";

		try {
			const res = await fetch(`${apiUrl}/api/requests`, {
				body: JSON.stringify(data),
				headers: {
					"Content-Type": "application/json",
					...(remoteIp ? { "x-forwarded-for": remoteIp } : {}),
				},
				method: "POST",
			});

			const body = (await res.json().catch(() => null)) as {
				success?: boolean;
				error?: string;
			} | null;

			if (!res.ok || !body?.success) {
				console.error("Public request submission failed:", res.status, body);
				return {
					error:
						res.status === 422
							? "Some answers were missing or invalid. Please check the form."
							: "There was an error submitting the form. Please try again.",
					success: false,
				};
			}

			return { success: true };
		} catch (error) {
			console.error("Public request submission error:", error);
			return {
				error: "Could not reach the server. Please try again.",
				success: false,
			};
		}
	});
