import { AdultMosquitoRequestsInsertSchema } from "@mcmec/supabase/db/adult-mosquito-requests";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { getSupabaseServiceClient } from "./supabase-service-client.server";
import { validateTurnstile } from "./validate-turnstile.server";

const AdultMosquitoRequestSchema = z.object({
	data: AdultMosquitoRequestsInsertSchema.extend({
		honeypot: z.string().optional(),
	}),
	turnstileToken: z.string(),
});

export const submitAdultMosquitoRequestServerFn = createServerFn({
	method: "POST",
})
	.inputValidator(AdultMosquitoRequestSchema)
	.handler(async ({ data }) => {
		// Server-side honeypot check - if filled, pretend success to confuse bots
		if (data.data.honeypot) {
			return { success: true };
		}

		const request = getRequest();
		const remoteIp =
			request.headers.get("cf-connecting-ip") ||
			request.headers.get("x-forwarded-for")?.split(",")[0] ||
			"127.0.0.1";

		const result = await validateTurnstile({
			remoteip: remoteIp,
			token: data.turnstileToken,
		});

		if (!result.success) {
			return { error: "Turnstile verification failed.", success: false };
		}

		const supabase = getSupabaseServiceClient();

		// Remove honeypot field before database insertion
		const { honeypot: _, ...submissionData } = data.data;

		const { error } = await supabase
			.from("adult_mosquito_complaints")
			.insert(submissionData);

		if (error) {
			console.error("Error inserting adult mosquito request:", error);
			return { error: "Database insertion failed.", success: false };
		}
		return { success: true };
	});
