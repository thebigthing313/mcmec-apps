import z from "zod";

export const PermissionsRowSchema = z.object({
	created_at: z.coerce.date<Date>(),
	id: z.uuid(),
	permission_description: z.string().nullable(),
	permission_name: z.string(),
});

export type PermissionsRowType = z.infer<typeof PermissionsRowSchema>;
