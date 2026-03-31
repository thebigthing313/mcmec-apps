import z from "zod";

export const UserPermissionsRowSchema = z.object({
	created_at: z.coerce.date<Date>(),
	created_by: z.uuid().nullable(),
	id: z.uuid(),
	permission_name: z.string(),
	updated_at: z.coerce.date<Date>(),
	updated_by: z.uuid().nullable(),
	user_id: z.uuid(),
});

export const UserPermissionsInsertSchema = z.object({
	id: z.uuid(),
	permission_name: z.string(),
	user_id: z.uuid(),
});

export type UserPermissionsRowType = z.infer<typeof UserPermissionsRowSchema>;
export type UserPermissionsInsertType = z.infer<
	typeof UserPermissionsInsertSchema
>;
