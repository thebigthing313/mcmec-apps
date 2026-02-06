import z from "zod";

export const ContactFormSubmissionsRowSchema = z.object({
	created_at: z.coerce.date<Date>(),
	created_by: z.string().nullable(),
	email: z.email(),
	id: z.uuid(),
	is_closed: z.boolean(),
	message: z.string(),
	name: z.string(),
	subject: z.string(),
	updated_at: z.coerce.date<Date>(),
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
