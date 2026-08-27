import z from "zod";

export const EmployeesRowSchema = z.object({
	created_at: z.coerce.date<Date>(),
	display_name: z.string(),
	display_title: z.string().nullable(),
	email: z.string(),
	id: z.uuid(),
	updated_at: z.coerce.date<Date>(),
	user_id: z.uuid().nullable(),
});

export type EmployeesRowType = z.infer<typeof EmployeesRowSchema>;
