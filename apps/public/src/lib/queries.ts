/**
 * Read path for the public site.
 *
 * Every query runs as a server function so the data is in the SSR response (this site is
 * SEO-critical — nothing here waits on a client fetch). Server-side it reads the API's
 * ElectricSQL shape proxy anonymously; the proxy applies the public policy, so unpublished
 * notices, documents, and job postings never reach this process at all.
 *
 * The exported `*QueryOptions` are the app's read interface — routes don't know or care
 * where the rows come from.
 */

import { fetchShapeSnapshot } from "@mcmec/collections";
import { DocumentTypesRowSchema } from "@mcmec/schemas/db/document-types";
import { DocumentsRowSchema } from "@mcmec/schemas/db/documents";
import { InsecticidesRowSchema } from "@mcmec/schemas/db/insecticides";
import { JobPostingsRowSchema } from "@mcmec/schemas/db/job-postings";
import { MeetingsRowSchema } from "@mcmec/schemas/db/meetings";
import { MosquitoActivityDataRowSchema } from "@mcmec/schemas/db/mosquito-activity-data";
import { MunicipalitiesRowSchema } from "@mcmec/schemas/db/municipalities";
import { NoticeTypesRowSchema } from "@mcmec/schemas/db/notice-types";
import { NoticesRowSchema } from "@mcmec/schemas/db/notices";
import { SprayScheduleMunicipalitiesRowSchema } from "@mcmec/schemas/db/spray-schedule-municipalities";
import { SpraySchedulesRowSchema } from "@mcmec/schemas/db/spray-schedules";
import { ZipCodesRowSchema } from "@mcmec/schemas/db/zip-codes";
import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import type z from "zod";
import type { ZodObject } from "zod";

function apiUrl(): string {
	const url = process.env.API_URL;
	if (!url) {
		throw new Error("API_URL is not set.");
	}
	return url;
}

/** Reads a whole shape and validates each row against its schema. */
async function readTable<TSchema extends ZodObject<z.ZodRawShape>>(
	table: string,
	schema: TSchema,
): Promise<z.infer<TSchema>[]> {
	const rows = await fetchShapeSnapshot({ apiUrl: apiUrl(), table });
	return rows.map((row) => schema.parse(row));
}

// ---------------------------------------------------------------------------
// Server functions
// ---------------------------------------------------------------------------

const getNoticesServerFn = createServerFn({ method: "GET" }).handler(() =>
	readTable("notices", NoticesRowSchema),
);

const getNoticeTypesServerFn = createServerFn({ method: "GET" }).handler(() =>
	readTable("notice_types", NoticeTypesRowSchema),
);

const getMeetingsServerFn = createServerFn({ method: "GET" }).handler(() =>
	readTable("meetings", MeetingsRowSchema),
);

const getInsecticidesServerFn = createServerFn({ method: "GET" }).handler(() =>
	readTable("insecticides", InsecticidesRowSchema),
);

const getZipCodesServerFn = createServerFn({ method: "GET" }).handler(() =>
	readTable("zip_codes", ZipCodesRowSchema),
);

const getDocumentsServerFn = createServerFn({ method: "GET" }).handler(() =>
	readTable("documents", DocumentsRowSchema),
);

const getDocumentTypesServerFn = createServerFn({ method: "GET" }).handler(() =>
	readTable("document_types", DocumentTypesRowSchema),
);

const getJobPostingsServerFn = createServerFn({ method: "GET" }).handler(() =>
	readTable("job_postings", JobPostingsRowSchema),
);

const getMosquitoActivityServerFn = createServerFn({ method: "GET" }).handler(
	() => readTable("mosquito_activity_data", MosquitoActivityDataRowSchema),
);

const getMunicipalitiesServerFn = createServerFn({ method: "GET" }).handler(
	async () => {
		const rows = await readTable("municipalities", MunicipalitiesRowSchema);
		return rows.sort((a, b) => a.name.localeCompare(b.name));
	},
);

/**
 * Spray schedules for the current season, with their insecticide and municipalities.
 *
 * PostgREST could express this as one nested select; shapes are per-table, so the four
 * shapes are read in parallel and joined here.
 */
const getSpraySchedulesServerFn = createServerFn({ method: "GET" }).handler(
	async () => {
		const [schedules, insecticides, links, municipalities] = await Promise.all([
			readTable("spray_schedules", SpraySchedulesRowSchema),
			readTable("insecticides", InsecticidesRowSchema),
			readTable(
				"spray_schedule_municipalities",
				SprayScheduleMunicipalitiesRowSchema,
			),
			readTable("municipalities", MunicipalitiesRowSchema),
		]);

		const insecticideById = new Map(insecticides.map((i) => [i.id, i]));
		const municipalityById = new Map(municipalities.map((m) => [m.id, m]));
		const currentYear = new Date().getFullYear();

		return schedules
			.filter((s) => s.mission_date.getFullYear() === currentYear)
			.map((schedule) => {
				const insecticide = insecticideById.get(schedule.insecticide_id);
				return {
					...schedule,
					insecticideLabelUrl: insecticide?.label_url ?? null,
					insecticideMsdsUrl: insecticide?.msds_url ?? null,
					insecticideName: insecticide?.trade_name ?? "",
					municipalities: links
						.filter((link) => link.spray_schedule_id === schedule.id)
						.map((link) => ({
							id: link.municipality_id,
							name: municipalityById.get(link.municipality_id)?.name ?? "",
						})),
				};
			});
	},
);

// ---------------------------------------------------------------------------
// Query options
// ---------------------------------------------------------------------------

const THIRTY_MINUTES = 1000 * 60 * 30;
const ONE_HOUR = 1000 * 60 * 60;

export const noticesQueryOptions = () =>
	queryOptions({
		queryFn: () => getNoticesServerFn(),
		queryKey: ["notices"],
		staleTime: THIRTY_MINUTES,
	});

export const noticeTypesQueryOptions = () =>
	queryOptions({
		queryFn: () => getNoticeTypesServerFn(),
		queryKey: ["notice_types"],
		staleTime: THIRTY_MINUTES,
	});

export const meetingsQueryOptions = () =>
	queryOptions({
		queryFn: () => getMeetingsServerFn(),
		queryKey: ["meetings"],
		staleTime: THIRTY_MINUTES,
	});

export const insecticidesQueryOptions = () =>
	queryOptions({
		queryFn: () => getInsecticidesServerFn(),
		queryKey: ["insecticides"],
		staleTime: THIRTY_MINUTES,
	});

export const zipCodesQueryOptions = () =>
	queryOptions({
		queryFn: () => getZipCodesServerFn(),
		queryKey: ["zip_codes"],
		staleTime: ONE_HOUR,
	});

export const documentsQueryOptions = () =>
	queryOptions({
		queryFn: () => getDocumentsServerFn(),
		queryKey: ["documents"],
		staleTime: THIRTY_MINUTES,
	});

export const documentTypesQueryOptions = () =>
	queryOptions({
		queryFn: () => getDocumentTypesServerFn(),
		queryKey: ["document_types"],
		staleTime: THIRTY_MINUTES,
	});

export const jobPostingsQueryOptions = () =>
	queryOptions({
		queryFn: () => getJobPostingsServerFn(),
		queryKey: ["job_postings"],
		staleTime: ONE_HOUR,
	});

export const spraySchedulesQueryOptions = () =>
	queryOptions({
		queryFn: () => getSpraySchedulesServerFn(),
		queryKey: ["spray_schedules"],
		staleTime: THIRTY_MINUTES,
	});

export const mosquitoActivityQueryOptions = () =>
	queryOptions({
		queryFn: () => getMosquitoActivityServerFn(),
		queryKey: ["mosquito_activity_data"],
		staleTime: THIRTY_MINUTES,
	});

export const municipalitiesQueryOptions = () =>
	queryOptions({
		queryFn: () => getMunicipalitiesServerFn(),
		queryKey: ["municipalities"],
		staleTime: ONE_HOUR,
	});
