// Public intake — POST /api/requests (anonymous).
//
// Merged `public_requests`: structured contact block + a per-type `details` JSON validated by a
// Zod discriminated union on request_type (the source of truth for each type's questions).
// Protected by Cloudflare Turnstile + a honeypot; no permission (public can submit).

import type { Context } from "hono";
import { z } from "zod";
import { db } from "./db";
import { publicRequests } from "./db/schema";

// shared contact fields for the service-request types
const contact = {
	name: z.string().min(1),
	email: z.email().optional(),
	phone: z.string().min(1),
	addressLine1: z.string().min(1),
	addressLine2: z.string().optional(),
	zipCodeId: z.uuid(),
};

const generalInquiry = z.object({
	requestType: z.literal("general_inquiry"),
	name: z.string().min(1),
	email: z.email(),
	details: z.object({
		subject: z.string().min(1),
		message: z.string().min(1),
	}),
});

const adultMosquito = z.object({
	requestType: z.literal("adult_mosquito"),
	...contact,
	details: z.object({
		isRearOfProperty: z.boolean(),
		isFrontOfProperty: z.boolean(),
		isGeneralVicinity: z.boolean(),
		isDuskDawn: z.boolean(),
		isDaytime: z.boolean(),
		isNighttime: z.boolean(),
		isAccessible: z.boolean(),
		additionalDetails: z.string().optional(),
	}),
});

const waterManagement = z.object({
	requestType: z.literal("water_management"),
	...contact,
	details: z.object({
		isOnMyProperty: z.boolean(),
		isOnNeighborProperty: z.boolean(),
		isOnPublicProperty: z.boolean(),
		otherLocationDescription: z.string().optional(),
		additionalDetails: z.string().optional(),
	}),
});

const mosquitoFish = z.object({
	requestType: z.literal("mosquito_fish"),
	...contact,
	details: z.object({
		locationOfWaterBody: z.string().min(1),
		typeOfWaterBody: z.string().min(1),
		additionalDetails: z.string().optional(),
	}),
});

const requestSchema = z.discriminatedUnion("requestType", [
	generalInquiry,
	adultMosquito,
	waterManagement,
	mosquitoFish,
]);

const envelope = z.object({
	turnstileToken: z.string().min(1),
	honeypot: z.string().optional(),
	request: requestSchema,
});

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
	const secret = process.env.CLOUDFLARE_TURNSTILE_SECRETKEY;
	if (!secret) return false;
	const res = await fetch(
		"https://challenges.cloudflare.com/turnstile/v0/siteverify",
		{
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				secret,
				response: token,
				remoteip: ip || undefined,
			}),
		},
	);
	const data = (await res.json()) as { success?: boolean };
	return data.success === true;
}

export async function submitRequest(c: Context): Promise<Response> {
	const body = await c.req.json().catch(() => null);
	const parsed = envelope.safeParse(body);
	if (!parsed.success) {
		return c.json({ error: "invalid", issues: parsed.error.issues }, 422);
	}
	const { turnstileToken, honeypot, request } = parsed.data;

	// honeypot filled => bot. Return success without inserting so we don't tip it off.
	if (honeypot && honeypot.trim() !== "") return c.json({ success: true });

	const ip =
		c.req.header("cf-connecting-ip") ?? c.req.header("x-forwarded-for") ?? "";
	if (!(await verifyTurnstile(turnstileToken, ip))) {
		return c.json({ error: "verification failed" }, 400);
	}

	// contact fields differ per branch; widen for the insert
	const r = request as {
		requestType: string;
		name: string;
		email?: string;
		phone?: string;
		addressLine1?: string;
		addressLine2?: string;
		zipCodeId?: string;
		details: Record<string, unknown>;
	};

	const [row] = await db
		.insert(publicRequests)
		.values({
			requestType: r.requestType,
			name: r.name,
			email: r.email ?? null,
			phone: r.phone ?? null,
			addressLine1: r.addressLine1 ?? null,
			addressLine2: r.addressLine2 ?? null,
			zipCodeId: r.zipCodeId ?? null,
			details: r.details,
		})
		.returning({ id: publicRequests.id });

	return c.json({ success: true, id: row?.id });
}
