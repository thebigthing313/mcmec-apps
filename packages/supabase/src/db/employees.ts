import z from "zod";

export const EmployeesRowSchema = z.object({
	created_at: z.coerce.date<Date>(),
	created_by: z.uuid().nullable(),
	display_name: z.string(),
	display_title: z.string().nullable(),
	email: z.string(),
	id: z.uuid(),
	updated_at: z.coerce.date<Date>(),
	updated_by: z.uuid().nullable(),
	user_id: z.uuid().nullable(),
});

export const EmployeesInsertSchema = z.object({
	display_name: z.string(),
	display_title: z.string().nullable().optional(),
	email: z.string(),
});

export const EmployeesUpdateSchema = z.object({
	display_name: z.string().optional(),
	display_title: z.string().nullable().optional(),
	email: z.string().optional(),
});

export type EmployeesRowType = z.infer<typeof EmployeesRowSchema>;
export type EmployeesInsertType = z.infer<typeof EmployeesInsertSchema>;
export type EmployeesUpdateType = z.infer<typeof EmployeesUpdateSchema>;
