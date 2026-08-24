import {
	DocumentTypesInsertSchema,
	DocumentTypesRowSchema,
	DocumentTypesUpdateSchema,
} from "@mcmec/schemas/db/document-types";
import {
	DocumentsInsertSchema,
	DocumentsRowSchema,
	DocumentsUpdateSchema,
} from "@mcmec/schemas/db/documents";
import { EmployeesRowSchema } from "@mcmec/schemas/db/employees";
import {
	InsecticidesInsertSchema,
	InsecticidesRowSchema,
	InsecticidesUpdateSchema,
} from "@mcmec/schemas/db/insecticides";
import {
	MeetingsInsertSchema,
	MeetingsRowSchema,
	MeetingsUpdateSchema,
} from "@mcmec/schemas/db/meetings";
import { MosquitoActivityDataRowSchema } from "@mcmec/schemas/db/mosquito-activity-data";
import {
	MunicipalitiesInsertSchema,
	MunicipalitiesRowSchema,
	MunicipalitiesUpdateSchema,
} from "@mcmec/schemas/db/municipalities";
import {
	NoticeTypesInsertSchema,
	NoticeTypesRowSchema,
	NoticeTypesUpdateSchema,
} from "@mcmec/schemas/db/notice-types";
import {
	NoticesInsertSchema,
	NoticesRowSchema,
	NoticesUpdateSchema,
} from "@mcmec/schemas/db/notices";
import {
	PublicRequestsRowSchema,
	PublicRequestsUpdateSchema,
} from "@mcmec/schemas/db/public-requests";
import { SprayScheduleMunicipalitiesRowSchema } from "@mcmec/schemas/db/spray-schedule-municipalities";
import {
	SpraySchedulesInsertSchema,
	SpraySchedulesRowSchema,
	SpraySchedulesUpdateSchema,
} from "@mcmec/schemas/db/spray-schedules";
import { ZipCodesRowSchema } from "@mcmec/schemas/db/zip-codes";
import { createEagerCollection, createOnDemandCollection } from "../factories";

export interface CreateNoticesCollectionsOptions {
	/** API origin (VITE_API_URL) */
	apiUrl: string;
}

export function createNoticesCollections({
	apiUrl,
}: CreateNoticesCollectionsOptions) {
	const employees = createEagerCollection({
		apiUrl,
		schema: EmployeesRowSchema,
		table: "employees",
	});

	const noticeTypes = createEagerCollection({
		allowDelete: true,
		apiUrl,
		insertSchema: NoticeTypesInsertSchema,
		schema: NoticeTypesRowSchema,
		table: "notice_types",
		updateSchema: NoticeTypesUpdateSchema,
	});

	const notices = createEagerCollection({
		allowDelete: true,
		apiUrl,
		insertSchema: NoticesInsertSchema,
		schema: NoticesRowSchema,
		table: "notices",
		updateSchema: NoticesUpdateSchema,
	});

	const meetings = createEagerCollection({
		allowDelete: true,
		apiUrl,
		insertSchema: MeetingsInsertSchema,
		schema: MeetingsRowSchema,
		table: "meetings",
		updateSchema: MeetingsUpdateSchema,
	});

	const documentTypes = createEagerCollection({
		allowDelete: true,
		apiUrl,
		insertSchema: DocumentTypesInsertSchema,
		schema: DocumentTypesRowSchema,
		table: "document_types",
		updateSchema: DocumentTypesUpdateSchema,
	});

	const documents = createEagerCollection({
		allowDelete: true,
		apiUrl,
		insertSchema: DocumentsInsertSchema,
		schema: DocumentsRowSchema,
		table: "documents",
		updateSchema: DocumentsUpdateSchema,
	});

	const insecticides = createEagerCollection({
		allowDelete: true,
		apiUrl,
		insertSchema: InsecticidesInsertSchema,
		schema: InsecticidesRowSchema,
		table: "insecticides",
		updateSchema: InsecticidesUpdateSchema,
	});

	const zipCodes = createEagerCollection({
		apiUrl,
		schema: ZipCodesRowSchema,
		table: "zip_codes",
	});

	// Merged intake — replaces the four legacy request collections. Insert is via the public
	// endpoint (POST /api/requests), so this staff collection is read + status-triage + delete.
	// The notices UI filters by `request_type`.
	//
	// On-demand: this table only grows, and pulling all of it on every page load doesn't
	// scale. Requires the shape proxy to forward `subset__*` params (see shapes.ts).
	const publicRequests = createOnDemandCollection({
		allowDelete: true,
		apiUrl,
		schema: PublicRequestsRowSchema,
		table: "public_requests",
		updateSchema: PublicRequestsUpdateSchema,
	});

	// Surveillance dataset — thousands of rows and growing a season at a time, read only by
	// the weekly-activity screen. Rows arrive via the CSV import endpoint, never this
	// collection. On-demand for the same reason as publicRequests.
	const mosquitoActivityData = createOnDemandCollection({
		apiUrl,
		schema: MosquitoActivityDataRowSchema,
		table: "mosquito_activity_data",
	});

	const municipalities = createEagerCollection({
		apiUrl,
		insertSchema: MunicipalitiesInsertSchema,
		schema: MunicipalitiesRowSchema,
		table: "municipalities",
		updateSchema: MunicipalitiesUpdateSchema,
	});

	const spraySchedules = createEagerCollection({
		allowDelete: true,
		apiUrl,
		insertSchema: SpraySchedulesInsertSchema,
		schema: SpraySchedulesRowSchema,
		table: "spray_schedules",
		updateSchema: SpraySchedulesUpdateSchema,
	});

	// Read-only here — a schedule's municipality set is replaced through the API's junction
	// endpoint, and the change syncs back through this collection.
	const sprayScheduleMunicipalities = createEagerCollection({
		apiUrl,
		schema: SprayScheduleMunicipalitiesRowSchema,
		table: "spray_schedule_municipalities",
	});

	return {
		documentTypes,
		documents,
		employees,
		insecticides,
		meetings,
		mosquitoActivityData,
		municipalities,
		noticeTypes,
		notices,
		publicRequests,
		sprayScheduleMunicipalities,
		spraySchedules,
		zipCodes,
	};
}

export type NoticesCollections = ReturnType<typeof createNoticesCollections>;
