import { ErrorMessages } from "@mcmec/lib/constants/errors";
import z from "zod";
import type { SupabaseClient } from "../client";

export const ContactFormSubmissionsRowSchema = z.object({
	created_at: z.coerce.date(),
	created_by: z.string().nullable(),
	email: z.email(),
	id: z.uuid(),
	is_closed: z.boolean(),
	message: z.string(),
	name: z.string(),
	subject: z.string(),
	updated_at: z.coerce.date(),
	updated_by: z.string().nullable(),
});

export const ContactFormSubmissionsInsertSchema = z.object({
	email: z.email(),
	honeypot: z.string().optional(), // Optional honeypot field for bot detection
	id: z.uuid(),
	is_closed: z.boolean(),
	message: z.string(),
	name: z.string(),
	subject: z.string(),
});

export const ContactFormSubmissionsUpdateSchema = z.object({
	email: z.email().optional(),
	is_closed: z.boolean().optional(),
	message: z.string().optional(),
	name: z.string().optional(),
	subject: z.string().optional(),
});

export type ContactFormSubmissionsRowType = z.infer<
	typeof ContactFormSubmissionsRowSchema
>;
export type ContactFormSubmissionsInsertType = z.infer<
	typeof ContactFormSubmissionsInsertSchema
>;
export type ContactFormSubmissionsUpdateType = z.infer<
	typeof ContactFormSubmissionsUpdateSchema
>;

export async function fetchContactFormSubmissions(
	supabase: SupabaseClient,
): Promise<Array<ContactFormSubmissionsRowType>> {
	const { data, error } = await supabase
		.from("contact_form_submissions")
		.select("*");

	if (error) {
		throw new Error(
			ErrorMessages.DATABASE.UNABLE_TO_FETCH("contact_form_submissions"),
		);
	}

	const parsedData = ContactFormSubmissionsRowSchema.array().parse(data);
	return parsedData;
}
