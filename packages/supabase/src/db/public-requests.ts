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
