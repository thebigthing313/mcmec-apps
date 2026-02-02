import { ErrorMessages } from "@mcmec/lib/constants/errors";
import { InsecticidesRowSchema } from "@mcmec/supabase/db/insecticides";
import { MeetingsRowSchema } from "@mcmec/supabase/db/meetings";
import { NoticeTypesRowSchema } from "@mcmec/supabase/db/notice-types";
import { NoticesRowSchema } from "@mcmec/supabase/db/notices";
import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { getSupabaseServerClient } from "./supabase-server";

// Server functions for fetching data
const getNoticesServerFn = createServerFn({ method: "GET" }).handler(
	async () => {
		const supabase = getSupabaseServerClient();
		async function fetchNotices() {
			const { data, error } = await supabase.from("notices").select("*");
			if (error) {
				throw new Error(ErrorMessages.DATABASE.UNABLE_TO_FETCH("notices"));
			}
			return data.map((notice) => {
				return NoticesRowSchema.parse(notice);
			});
		}
		return fetchNotices();
	},
);

const getNoticeTypesServerFn = createServerFn({ method: "GET" }).handler(
	async () => {
		const supabase = getSupabaseServerClient();
		async function fetchNoticeTypes() {
			const { data, error } = await supabase.from("notice_types").select("*");
			if (error) {
				throw new Error(ErrorMessages.DATABASE.UNABLE_TO_FETCH("notice_types"));
			}
			return data.map((noticeType) => {
				return NoticeTypesRowSchema.parse(noticeType);
			});
		}
		return fetchNoticeTypes();
	},
);

const getMeetingsServerFn = createServerFn({ method: "GET" }).handler(
	async () => {
		const supabase = getSupabaseServerClient();
		async function fetchMeetings() {
			const { data, error } = await supabase.from("meetings").select("*");
			if (error) {
				throw new Error(ErrorMessages.DATABASE.UNABLE_TO_FETCH("meetings"));
			}
			return data.map((meeting) => {
				return MeetingsRowSchema.parse(meeting);
			});
		}
		return fetchMeetings();
	},
);

const getInsecticidesServerFn = createServerFn({ method: "GET" }).handler(
	async () => {
		const supabase = getSupabaseServerClient();
		async function fetchInsecticides() {
			const { data, error } = await supabase.from("insecticides").select("*");
			if (error) {
				throw new Error(ErrorMessages.DATABASE.UNABLE_TO_FETCH("insecticides"));
			}
			return data.map((insecticide) => {
				return InsecticidesRowSchema.parse(insecticide);
			});
		}
		return fetchInsecticides();
	},
);

// Query options for TanStack Query
export const noticesQueryOptions = () =>
	queryOptions({
		queryFn: () => getNoticesServerFn(),
		queryKey: ["notices"],
		staleTime: 1000 * 60 * 30, // 30 minutes
	});

export const noticeTypesQueryOptions = () =>
	queryOptions({
		queryFn: () => getNoticeTypesServerFn(),
		queryKey: ["notice_types"],
		staleTime: 1000 * 60 * 30, // 30 minutes
	});

export const meetingsQueryOptions = () =>
	queryOptions({
		queryFn: () => getMeetingsServerFn(),
		queryKey: ["meetings"],
		staleTime: 1000 * 60 * 30, // 30 minutes
	});

export const insecticidesQueryOptions = () =>
	queryOptions({
		queryFn: () => getInsecticidesServerFn(),
		queryKey: ["insecticides"],
		staleTime: 1000 * 60 * 30, // 30 minutes
	});
