import z from "zod";

export const InsecticidesRowSchema = z.object({
	active_ingredient: z.string(),
	active_ingredient_url: z.url(),
	created_at: z.coerce.date<Date>(),
	id: z.uuid(),
	label_url: z.url(),
	msds_url: z.url(),
	trade_name: z.string(),
	type_name: z.string(),
	updated_at: z.coerce.date<Date>(),
});

export type InsecticidesRowType = z.infer<typeof InsecticidesRowSchema>;
