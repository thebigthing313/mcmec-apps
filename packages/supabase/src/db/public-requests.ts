import z from "zod";

/**
 * Merged public intake — the `public_requests` table (Railway backend).
 *
 * Replaces the four legacy intake tables (adult_mosquito_complaints,
 * contact_form_submissions, mosquito_fish_requests, water_management_requests). Rows are
 * discriminated by `request_type`; per-type answers live in the `details` jsonb (validated
 * server-side by the API's discriminated union — see apps/api/src/requests.ts).
 *
 * Inserts happen ONLY via the public intake endpoint (POST /api/requests); the staff-facing
 * collection is read + status-triage + delete (no insert). Snake_case matches Electric output.
 */

export const RequestStatusEnum = z.enum(["new", "in_progress", "resolved"]);
export type RequestStatus = z.infer<typeof RequestStatusEnum>;

// request_type discriminator values (mirror apps/api/src/requests.ts)
export const RequestTypeEnum = z.enum([
	"general_inquiry",
	"adult_mosquito",
	"water_management",
	"mosquito_fish",
]);
export type RequestType = z.infer<typeof RequestTypeEnum>;

export const PublicRequestsRowSchema = z.object({
	id: z.uuid(),
	request_type: z.string(),
	name: z.string(),
	email: z.string().nullable(),
	phone: z.string().nullable(),
	address_line_1: z.string().nullable(),
	address_line_2: z.string().nullable(),
	zip_code_id: z.uuid().nullable(),
	details: z.any(),
	status: RequestStatusEnum,
	created_at: z.coerce.date<Date>(),
	updated_at: z.coerce.date<Date>(),
});

// Staff triage: status transitions (and optional contact corrections). No insert — the
// public endpoint owns creation; drizzle-zod strips id/timestamps server-side regardless.
export const PublicRequestsUpdateSchema = z.object({
	status: RequestStatusEnum.optional(),
	name: z.string().optional(),
	email: z.string().nullable().optional(),
	phone: z.string().nullable().optional(),
	address_line_1: z.string().nullable().optional(),
	address_line_2: z.string().nullable().optional(),
});

export type PublicRequestsRowType = z.infer<typeof PublicRequestsRowSchema>;
export type PublicRequestsUpdateType = z.infer<
	typeof PublicRequestsUpdateSchema
>;

// ---------------------------------------------------------------------------
// Submission payloads — the public intake contract
// ---------------------------------------------------------------------------

/**
 * Mirrors the discriminated union the API validates in `apps/api/src/requests.ts`.
 * camelCase, because that's what the endpoint accepts; the columns it lands in are
 * snake_case (see the row schema above).
 *
 * Keep the two in sync — the API is the authority, this is the client's copy of it.
 */

const shortText = z.string().min(1).max(300);
const longText = z.string().min(1).max(5000);

/** Contact block shared by the three field-service request types. */
const contact = {
	name: shortText,
	email: z.email().max(320).optional(),
	phone: z.string().min(1).max(50),
	addressLine1: shortText,
	addressLine2: z.string().max(300).optional(),
	zipCodeId: z.uuid(),
};

export const GeneralInquirySubmissionSchema = z.object({
	requestType: z.literal("general_inquiry"),
	name: shortText,
	email: z.email().max(320),
	details: z.object({
		subject: shortText,
		message: longText,
	}),
});

export const AdultMosquitoSubmissionSchema = z.object({
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
		additionalDetails: z.string().max(5000).optional(),
	}),
});

export const WaterManagementSubmissionSchema = z.object({
	requestType: z.literal("water_management"),
	...contact,
	details: z.object({
		isOnMyProperty: z.boolean(),
		isOnNeighborProperty: z.boolean(),
		isOnPublicProperty: z.boolean(),
		otherLocationDescription: z.string().max(1000).optional(),
		additionalDetails: z.string().max(5000).optional(),
	}),
});

export const MosquitoFishSubmissionSchema = z.object({
	requestType: z.literal("mosquito_fish"),
	...contact,
	details: z.object({
		locationOfWaterBody: z.string().min(1).max(500),
		typeOfWaterBody: z.string().min(1).max(500),
		additionalDetails: z.string().max(5000).optional(),
	}),
});

export const PublicRequestSubmissionSchema = z.discriminatedUnion(
	"requestType",
	[
		GeneralInquirySubmissionSchema,
		AdultMosquitoSubmissionSchema,
		WaterManagementSubmissionSchema,
		MosquitoFishSubmissionSchema,
	],
);

export type PublicRequestSubmission = z.infer<
	typeof PublicRequestSubmissionSchema
>;

// ---------------------------------------------------------------------------
// Form shapes
// ---------------------------------------------------------------------------

/**
 * The public site's intake forms are flat and snake_case; the endpoint takes a nested
 * camelCase payload. These validate what the user typed, with the same constraints as the
 * submission schemas above, and each route maps its values into the payload on submit.
 */

/** Optional in the payload, but a form field is "" until filled. */
const optionalEmail = z.union([z.email(), z.literal(""), z.null()]);

const ServiceRequestContactFormSchema = z.object({
	full_name: shortText,
	email: optionalEmail,
	phone: z.string().min(1, "Phone is required").max(50),
	address_line_1: shortText,
	address_line_2: z.string().max(300).nullable(),
	zip_code_id: z.uuid("Select a zip code"),
});

export const AdultMosquitoFormSchema = ServiceRequestContactFormSchema.extend({
	is_rear_of_property: z.boolean(),
	is_front_of_property: z.boolean(),
	is_general_vicinity: z.boolean(),
	is_dusk_dawn: z.boolean(),
	is_daytime: z.boolean(),
	is_nighttime: z.boolean(),
	is_accessible: z.boolean(),
	additional_details: z.string().max(5000).nullable(),
});

export const WaterManagementFormSchema = ServiceRequestContactFormSchema.extend(
	{
		is_on_my_property: z.boolean(),
		is_on_neighbor_property: z.boolean(),
		is_on_public_property: z.boolean(),
		other_location_description: z.string().max(1000).nullable(),
		additional_details: z.string().max(5000).nullable(),
	},
);

export const MosquitoFishFormSchema = ServiceRequestContactFormSchema.extend({
	location_of_water_body: z.string().min(1, "Required").max(500),
	type_of_water_body: z.string().min(1, "Required").max(500),
	additional_details: z.string().max(5000).nullable(),
});

export type AdultMosquitoFormType = z.infer<typeof AdultMosquitoFormSchema>;
export type WaterManagementFormType = z.infer<typeof WaterManagementFormSchema>;
export type MosquitoFishFormType = z.infer<typeof MosquitoFishFormSchema>;

/** Shared mapping from a flat contact block to the payload's camelCase fields. */
export function toContactPayload(value: {
	full_name: string;
	email: string | null;
	phone: string;
	address_line_1: string;
	address_line_2: string | null;
	zip_code_id: string;
}) {
	return {
		name: value.full_name,
		email: value.email || undefined,
		phone: value.phone,
		addressLine1: value.address_line_1,
		addressLine2: value.address_line_2 || undefined,
		zipCodeId: value.zip_code_id,
	};
}
