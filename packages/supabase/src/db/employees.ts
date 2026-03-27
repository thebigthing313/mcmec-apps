import { ErrorMessages } from "@mcmec/lib/constants/errors";
import z from "zod";
import type { SupabaseClient } from "../client";

export const EmployeesRowSchema = z.object({
	created_at: z.coerce.date(),
	created_by: z.uuid().nullable(),
	display_name: z.string(),
	display_title: z.string().nullable(),
	email: z.string(),
	id: z.uuid(),
	updated_at: z.coerce.date(),
	updated_by: z.uuid().nullable(),
	user_id: z.uuid().nullable(),
});

export type EmployeesRowType = z.infer<typeof EmployeesRowSchema>;

export async function fetchEmployees(
	supabase: SupabaseClient,
): Promise<Array<EmployeesRowType>> {
	const { data, error } = await supabase.from("employees").select("*");
	if (error) {
		throw new Error(ErrorMessages.DATABASE.UNABLE_TO_FETCH("employees"));
	}
	const parsedData = EmployeesRowSchema.array().parse(data);
	return parsedData;
}
