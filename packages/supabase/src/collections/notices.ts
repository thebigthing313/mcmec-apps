import {
	createEagerCollection,
	createOnDemandCollection,
} from "@mcmec/supabase-tanstack-db-integration";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { QueryClient } from "@tanstack/query-core";
import type { Database } from "../database.types.ts";
import {
	AdultMosquitoRequestsBaseSchema,
	AdultMosquitoRequestsInsertSchema,
	AdultMosquitoRequestsUpdateSchema,
} from "../db/adult-mosquito-requests";
import {
	ContactFormSubmissionsInsertSchema,
	ContactFormSubmissionsRowSchema,
	ContactFormSubmissionsUpdateSchema,
} from "../db/contact-form-submissions";
import {
	DocumentTypesInsertSchema,
	DocumentTypesRowSchema,
	DocumentTypesUpdateSchema,
} from "../db/document-types";
import {
	DocumentsInsertSchema,
	DocumentsRowSchema,
	DocumentsUpdateSchema,
} from "../db/documents";
import { EmployeesRowSchema } from "../db/employees";
import {
	InsecticidesInsertSchema,
	InsecticidesRowSchema,
	InsecticidesUpdateSchema,
} from "../db/insecticides";
import {
	MeetingsInsertSchema,
	MeetingsRowSchema,
	MeetingsUpdateSchema,
} from "../db/meetings";
import {
	MosquitofishRequestsInsertSchema,
	MosquitofishRequestsRowSchema,
	MosquitofishRequestsUpdateSchema,
} from "../db/mosquitofish-requests";
import {
	NoticeTypesInsertSchema,
	NoticeTypesRowSchema,
	NoticeTypesUpdateSchema,
} from "../db/notice-types";
import {
	NoticesInsertSchema,
	NoticesRowSchema,
	NoticesUpdateSchema,
} from "../db/notices";
import {
	WaterManagementRequestsBaseSchema,
	WaterManagementRequestsInsertSchema,
	WaterManagementRequestsUpdateSchema,
} from "../db/water-management-requests";
import { ZipCodesRowSchema } from "../db/zip-codes";

export interface CreateNoticesCollectionsOptions {
	supabase: SupabaseClient<Database>;
	queryClient: QueryClient;
}

export function createNoticesCollections({
	supabase,
	queryClient,
}: CreateNoticesCollectionsOptions) {
	const employees = createEagerCollection({
		queryClient,
		schema: EmployeesRowSchema,
		supabase,
		table: "employees",
	});

	const noticeTypes = createEagerCollection({
		allowDelete: true,
		insertSchema: NoticeTypesInsertSchema,
		queryClient,
		schema: NoticeTypesRowSchema,
		supabase,
		table: "notice_types",
		updateSchema: NoticeTypesUpdateSchema,
	});

	const notices = createEagerCollection({
		allowDelete: true,
		insertSchema: NoticesInsertSchema,
		queryClient,
		schema: NoticesRowSchema,
		supabase,
		table: "notices",
		updateSchema: NoticesUpdateSchema,
	});

	const meetings = createEagerCollection({
		allowDelete: true,
		insertSchema: MeetingsInsertSchema,
		queryClient,
		schema: MeetingsRowSchema,
		supabase,
		table: "meetings",
		updateSchema: MeetingsUpdateSchema,
	});

	const documentTypes = createEagerCollection({
		allowDelete: true,
		insertSchema: DocumentTypesInsertSchema,
		queryClient,
		schema: DocumentTypesRowSchema,
		supabase,
		table: "document_types",
		updateSchema: DocumentTypesUpdateSchema,
	});

	const documents = createEagerCollection({
		allowDelete: true,
		insertSchema: DocumentsInsertSchema,
		queryClient,
		schema: DocumentsRowSchema,
		supabase,
		table: "documents",
		updateSchema: DocumentsUpdateSchema,
	});

	const insecticides = createEagerCollection({
		allowDelete: true,
		insertSchema: InsecticidesInsertSchema,
		queryClient,
		schema: InsecticidesRowSchema,
		supabase,
		table: "insecticides",
		updateSchema: InsecticidesUpdateSchema,
	});

	const zipCodes = createEagerCollection({
		queryClient,
		schema: ZipCodesRowSchema,
		supabase,
		table: "zip_codes",
	});

	const adultMosquitoRequests = createOnDemandCollection({
		allowDelete: true,
		insertSchema: AdultMosquitoRequestsInsertSchema,
		queryClient,
		schema: AdultMosquitoRequestsBaseSchema,
		supabase,
		table: "adult_mosquito_complaints",
		updateSchema: AdultMosquitoRequestsUpdateSchema,
	});

	const mosquitofishRequests = createOnDemandCollection({
		allowDelete: true,
		insertSchema: MosquitofishRequestsInsertSchema,
		queryClient,
		schema: MosquitofishRequestsRowSchema,
		supabase,
		table: "mosquito_fish_requests",
		updateSchema: MosquitofishRequestsUpdateSchema,
	});

	const waterManagementRequests = createOnDemandCollection({
		allowDelete: true,
		insertSchema: WaterManagementRequestsInsertSchema,
		queryClient,
		schema: WaterManagementRequestsBaseSchema,
		supabase,
		table: "water_management_requests",
		updateSchema: WaterManagementRequestsUpdateSchema,
	});

	const contactFormSubmissions = createOnDemandCollection({
		allowDelete: true,
		insertSchema: ContactFormSubmissionsInsertSchema,
		queryClient,
		schema: ContactFormSubmissionsRowSchema,
		supabase,
		table: "contact_form_submissions",
		updateSchema: ContactFormSubmissionsUpdateSchema,
	});

	return {
		adultMosquitoRequests,
		contactFormSubmissions,
		documentTypes,
		documents,
		employees,
		insecticides,
		meetings,
		mosquitofishRequests,
		noticeTypes,
		notices,
		waterManagementRequests,
		zipCodes,
	};
}

export type NoticesCollections = ReturnType<typeof createNoticesCollections>;
