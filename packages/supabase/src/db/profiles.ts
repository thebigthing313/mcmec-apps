import { ErrorMessages } from "@mcmec/lib/constants/errors";
import z from "zod";
import type { SupabaseClient } from "../client";

export const ProfilesRowSchema = z.object({
	avatar_url: z.url().nullable(),
	created_at: z.coerce.date(),
	created_by: z.uuid().nullable(),
	display_name: z.string(),
	display_title: z.string().nullable(),
	id: z.uuid(),
	updated_at: z.coerce.date(),
	updated_by: z.uuid().nullable(),
	user_id: z.uuid(),
});

export const ProfilesInsertSchema = z.object({
	avatar_url: z.url().nullable(),
	display_name: z.string(),
	display_title: z.string().nullable(),
	id: z.uuid(),
	user_id: z.uuid(),
});

export const ProfilesUpdateSchema = z.object({
	avatar_url: z.url().optional(),
	display_name: z.string().optional(),
	display_title: z.string().optional(),
	user_id: z.uuid().optional(),
});

export type ProfilesRowType = z.infer<typeof ProfilesRowSchema>;
export type ProfilesInsertType = z.infer<typeof ProfilesInsertSchema>;
export type ProfilesUpdateType = z.infer<typeof ProfilesUpdateSchema>;

export async function fetchProfiles(
	supabase: SupabaseClient,
): Promise<Array<ProfilesRowType>> {
	const { data, error } = await supabase.from("user_profiles").select("*");
	if (error) {
		throw new Error(ErrorMessages.DATABASE.UNABLE_TO_FETCH("user_profiles"));
	}
	const parsedData = ProfilesRowSchema.array().parse(data);
	return parsedData;
}
