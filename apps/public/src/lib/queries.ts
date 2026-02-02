import {
	fetchInsecticides,
	type InsecticidesRowType,
} from "@mcmec/supabase/db/insecticides";
import {
	fetchMeetings,
	type MeetingsRowType,
} from "@mcmec/supabase/db/meetings";
import {
	fetchNoticeTypes,
	type NoticeTypesRowType,
} from "@mcmec/supabase/db/notice-types";
import { fetchNotices, type NoticesRowType } from "@mcmec/supabase/db/notices";
import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { getSupabaseServerClient } from "./supabase-server";

// Server functions for fetching data
const getNoticesServerFn = createServerFn({ method: "GET" }).handler(
	async () => {
		const supabase = getSupabaseServerClient();
		return fetchNotices(supabase);
	},
);

const getNoticeTypesServerFn = createServerFn({ method: "GET" }).handler(
	async () => {
		const supabase = getSupabaseServerClient();
		return fetchNoticeTypes(supabase);
	},
);

const getMeetingsServerFn = createServerFn({ method: "GET" }).handler(
	async () => {
		const supabase = getSupabaseServerClient();
		return fetchMeetings(supabase);
	},
);

const getInsecticidesServerFn = createServerFn({ method: "GET" }).handler(
	async () => {
		const supabase = getSupabaseServerClient();
		return fetchInsecticides(supabase);
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

// Export types for convenience
export type {
	NoticesRowType,
	NoticeTypesRowType,
	MeetingsRowType,
	InsecticidesRowType,
};
