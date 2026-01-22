import { ErrorMessages } from "@mcmec/lib/constants/errors";
import z from "zod";
import type { SupabaseClient } from "../client";

export const MeetingsRowSchema = z.object({
	agenda_url: z.url().nullable(),
	created_at: z.coerce.date(),
	created_by: z.string().nullable(),
	id: z.uuid(),
	is_cancelled: z.boolean(),
	location: z.string(),
	meeting_at: z.coerce.date(),
	minutes_url: z.url().nullable(),
	name: z.string(),
	notes: z.string().nullable(),
	notice_url: z.url().nullable(),
	report_url: z.url().nullable(),
	updated_at: z.coerce.date(),
	updated_by: z.string().nullable(),
});

export const MeetingsInsertSchema = z.object({
	agenda_url: z.url().nullable(),
	id: z.uuid(),
	is_cancelled: z.boolean(),
	location: z.string(),
	meeting_at: z.coerce.date(),
	minutes_url: z.url().nullable(),
	name: z.string(),
	notes: z.string().nullable(),
	notice_url: z.url().nullable(),
	report_url: z.url().nullable(),
});

export const MeetingsUpdateSchema = z.object({
	agenda_url: z.url().optional(),
	is_cancelled: z.boolean().optional(),
	location: z.string().optional(),
	meeting_at: z.coerce.date().optional(),
	minutes_url: z.url().nullable().optional(),
	name: z.string().optional(),
	notes: z.string().nullable().optional(),
	notice_url: z.url().nullable().optional(),
	report_url: z.url().nullable().optional(),
});

export type MeetingsRowType = z.infer<typeof MeetingsRowSchema>;
export type MeetingsInsertType = z.infer<typeof MeetingsInsertSchema>;
export type MeetingsUpdateType = z.infer<typeof MeetingsUpdateSchema>;

export async function fetchMeetings(
	supabase: SupabaseClient,
): Promise<Array<MeetingsRowType>> {
	const { data, error } = await supabase.from("meetings").select("*");

	if (error) {
		throw new Error(ErrorMessages.DATABASE.UNABLE_TO_FETCH("meetings"));
	}

	const parsedData = MeetingsRowSchema.array().parse(data);
	return parsedData;
}
