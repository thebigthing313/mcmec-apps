import z from "zod";

export const ZipCodesRowSchema = z.object({
	city: z.string(),
	code: z.string(),
	created_at: z.coerce.date<Date>(),
	id: z.uuid(),
	state: z.string(),
	updated_at: z.coerce.date<Date>(),
});

export type ZipCodesRowType = z.infer<typeof ZipCodesRowSchema>;
