import { ErrorMessages } from "@mcmec/lib/constants/errors";
import { DocumentTypesRowSchema } from "@mcmec/supabase/db/document-types";
import { DocumentsRowSchema } from "@mcmec/supabase/db/documents";
import { InsecticidesRowSchema } from "@mcmec/supabase/db/insecticides";
import { JobPostingsRowSchema } from "@mcmec/supabase/db/job-postings";
import { MeetingsRowSchema } from "@mcmec/supabase/db/meetings";
import { NoticeTypesRowSchema } from "@mcmec/supabase/db/notice-types";
import { NoticesRowSchema } from "@mcmec/supabase/db/notices";
import { ZipCodesRowSchema } from "@mcmec/supabase/db/zip-codes";
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

const getZipCodesServerFn = createServerFn({ method: "GET" }).handler(
	async () => {
		const supabase = getSupabaseServerClient();
		async function fetchZipCodes() {
			const { data, error } = await supabase.from("zip_codes").select("*");
			if (error) {
				throw new Error(ErrorMessages.DATABASE.UNABLE_TO_FETCH("zip_codes"));
			}
			return data.map((zipCode) => {
				return ZipCodesRowSchema.parse(zipCode);
			});
		}
		return fetchZipCodes();
	},
);

export const zipCodesQueryOptions = () =>
	queryOptions({
		queryFn: () => getZipCodesServerFn(),
		queryKey: ["zip_codes"],
		staleTime: 1000 * 60 * 60, // 1 hour
	});

const getDocumentsServerFn = createServerFn({ method: "GET" }).handler(
	async () => {
		const supabase = getSupabaseServerClient();
		async function fetchDocuments() {
			const { data, error } = await supabase.from("documents").select("*");
			if (error) {
				throw new Error(ErrorMessages.DATABASE.UNABLE_TO_FETCH("documents"));
			}
			return data.map((document) => {
				return DocumentsRowSchema.parse(document);
			});
		}
		return fetchDocuments();
	},
);

const getDocumentTypesServerFn = createServerFn({ method: "GET" }).handler(
	async () => {
		const supabase = getSupabaseServerClient();
		async function fetchDocumentTypes() {
			const { data, error } = await supabase.from("document_types").select("*");
			if (error) {
				throw new Error(
					ErrorMessages.DATABASE.UNABLE_TO_FETCH("document_types"),
				);
			}
			return data.map((documentType) => {
				return DocumentTypesRowSchema.parse(documentType);
			});
		}
		return fetchDocumentTypes();
	},
);

export const documentsQueryOptions = () =>
	queryOptions({
		queryFn: () => getDocumentsServerFn(),
		queryKey: ["documents"],
		staleTime: 1000 * 60 * 30, // 30 minutes
	});

export const documentTypesQueryOptions = () =>
	queryOptions({
		queryFn: () => getDocumentTypesServerFn(),
		queryKey: ["document_types"],
		staleTime: 1000 * 60 * 30, // 30 minutes
	});

const getJobPostingsServerFn = createServerFn({ method: "GET" }).handler(
	async () => {
		const supabase = getSupabaseServerClient();
		async function fetchJobPostings() {
			const { data, error } = await supabase.from("job_postings").select("*");
			if (error) {
				throw new Error(ErrorMessages.DATABASE.UNABLE_TO_FETCH("job_postings"));
			}
			return data.map((posting) => {
				return JobPostingsRowSchema.parse(posting);
			});
		}
		return fetchJobPostings();
	},
);

export const jobPostingsQueryOptions = () =>
	queryOptions({
		queryFn: () => getJobPostingsServerFn(),
		queryKey: ["job_postings"],
		staleTime: 1000 * 60 * 60, // 1 hour
	});
