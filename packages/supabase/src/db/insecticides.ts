import { ErrorMessages } from "@mcmec/lib/constants/errors";
import z from "zod";
import type { SupabaseClient } from "../client";

export const InsecticidesRowSchema = z.object({
	active_ingredient: z.string(),
	active_ingredient_url: z.url(),
	created_at: z.coerce.date(),
	created_by: z.string().nullable(),
	id: z.uuid(),
	label_url: z.url(),
	msds_url: z.url(),
	trade_name: z.string(),
	type_name: z.string(),
	updated_at: z.coerce.date(),
	updated_by: z.string().nullable(),
});

export const InsecticidesInsertSchema = z.object({
	active_ingredient: z.string(),
	active_ingredient_url: z.url(),
	id: z.uuid(),
	label_url: z.url(),
	msds_url: z.url(),
	trade_name: z.string(),
	type_name: z.string(),
});

export const InsecticidesUpdateSchema = z.object({
	active_ingredient: z.string().optional(),
	active_ingredient_url: z.url().optional(),
	label_url: z.url().optional(),
	msds_url: z.url().optional(),
	trade_name: z.string().optional(),
	type_name: z.string().optional(),
});

export type InsecticidesRowType = z.infer<typeof InsecticidesRowSchema>;
export type InsecticidesInsertType = z.infer<typeof InsecticidesInsertSchema>;
export type InsecticidesUpdateType = z.infer<typeof InsecticidesUpdateSchema>;

export async function fetchInsecticides(
	supabase: SupabaseClient,
): Promise<Array<InsecticidesRowType>> {
	const { data, error } = await supabase.from("insecticides").select("*");

	if (error) {
		throw new Error(ErrorMessages.DATABASE.UNABLE_TO_FETCH("insecticides"));
	}

	const parsedData = InsecticidesRowSchema.array().parse(data);
	return parsedData;
}
