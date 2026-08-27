import { DocumentTypesRowSchema } from "@mcmec/schemas/db/document-types";
import { DocumentsRowSchema } from "@mcmec/schemas/db/documents";
import { EmployeesRowSchema } from "@mcmec/schemas/db/employees";
import { InsecticidesRowSchema } from "@mcmec/schemas/db/insecticides";
import { JobPostingsRowSchema } from "@mcmec/schemas/db/job-postings";
import { MeetingsRowSchema } from "@mcmec/schemas/db/meetings";
import { MosquitoActivityDataRowSchema } from "@mcmec/schemas/db/mosquito-activity-data";
import { MunicipalitiesRowSchema } from "@mcmec/schemas/db/municipalities";
import { NoticeTypesRowSchema } from "@mcmec/schemas/db/notice-types";
import { NoticesRowSchema } from "@mcmec/schemas/db/notices";
import { PublicRequestsRowSchema } from "@mcmec/schemas/db/public-requests";
import { SprayScheduleMunicipalitiesRowSchema } from "@mcmec/schemas/db/spray-schedule-municipalities";
import { SpraySchedulesRowSchema } from "@mcmec/schemas/db/spray-schedules";
import { ZipCodesRowSchema } from "@mcmec/schemas/db/zip-codes";
import { createEagerCollection, createOnDemandCollection } from "../factories";

export interface CreateNoticesCollectionsOptions {
	/** API origin (VITE_API_URL) */
	apiUrl: string;
}

export function createNoticesCollections({
	apiUrl,
}: CreateNoticesCollectionsOptions) {
	// Read-only here, and `commands: true` all the same: the flag says how the TABLE is
	// written, not whether this app writes it (#174). `employees` cut over with #165.
	const employees = createEagerCollection({
		apiUrl,
		commands: true,
		schema: EmployeesRowSchema,
		table: "employees",
	});

	const noticeTypes = createEagerCollection({
		apiUrl,
		commands: true,
		schema: NoticeTypesRowSchema,
		table: "notice_types",
	});

	// On the named-command path (#152, extended by #159 to the three plain lookup tables).
	// These collections' writes carry an intent and go to POST /api/commands; the Insert/Update
	// schema pair is gone, because a command payload is not "a row minus the server columns".
	//
	// Job postings moved here from `apps/hr` with #145: they are website content, so they are
	// read and written under `manage_website`.
	const jobPostings = createEagerCollection({
		apiUrl,
		commands: true,
		schema: JobPostingsRowSchema,
		table: "job_postings",
	});

	const notices = createEagerCollection({
		apiUrl,
		commands: true,
		schema: NoticesRowSchema,
		table: "notices",
	});

	const meetings = createEagerCollection({
		apiUrl,
		commands: true,
		schema: MeetingsRowSchema,
		table: "meetings",
	});

	const documentTypes = createEagerCollection({
		apiUrl,
		commands: true,
		schema: DocumentTypesRowSchema,
		table: "document_types",
	});

	const documents = createEagerCollection({
		apiUrl,
		commands: true,
		schema: DocumentsRowSchema,
		table: "documents",
	});

	const insecticides = createEagerCollection({
		apiUrl,
		commands: true,
		schema: InsecticidesRowSchema,
		table: "insecticides",
	});

	const zipCodes = createEagerCollection({
		apiUrl,
		schema: ZipCodesRowSchema,
		table: "zip_codes",
	});

	// Merged intake — replaces the four legacy request collections. Rows are minted by the
	// public website through POST /api/requests, the one bespoke door the cutover keeps (#164);
	// this staff collection triages and deletes them. The notices UI filters by `request_type`.
	//
	// The Update schema went with the cutover: it declared contact corrections — name, email,
	// phone, address — that no screen has ever offered and no command names, so it was
	// advertising a write this collection could not make. `municipalities` lost its the same
	// way in #159.
	//
	// On-demand: this table only grows, and pulling all of it on every page load doesn't
	// scale. Requires the shape proxy to forward `subset__*` params (see shapes.ts).
	const publicRequests = createOnDemandCollection({
		apiUrl,
		commands: true,
		schema: PublicRequestsRowSchema,
		table: "public_requests",
	});

	// Surveillance dataset — thousands of rows and growing a season at a time, read only by
	// the weekly-activity screen. Rows arrive through `website.importMosquitoActivity`, which
	// this collection does not carry: the import replaces a whole year, so there is no
	// optimistic row to insert and the screen reads aggregates, never rows (#163). It goes
	// straight to the dispatcher via `sendCommand` and the new season streams back in here.
	// `commands: true` is still required — the flag says how this TABLE is written, and the
	// table has commands (#174).
	const mosquitoActivityData = createOnDemandCollection({
		apiUrl,
		commands: true,
		schema: MosquitoActivityDataRowSchema,
		table: "mosquito_activity_data",
	});

	// Read-only, and now read-only on the server too: #159 deleted its `WRITABLE` entry, since
	// no app has ever written it and municipality management belongs to the reserved `reference`
	// domain. The Insert/Update schemas went with the door — a collection that carries them
	// advertises a write it cannot make.
	const municipalities = createEagerCollection({
		apiUrl,
		schema: MunicipalitiesRowSchema,
		table: "municipalities",
	});

	const spraySchedules = createEagerCollection({
		apiUrl,
		commands: true,
		schema: SpraySchedulesRowSchema,
		table: "spray_schedules",
	});

	// Read-only here, and read-only everywhere: a mission's municipality set is not written row
	// by row but replaced whole, by the same command that writes the mission (#162). The ids
	// ride in that mutation's `arguments` metadata, the server writes both tables in one
	// transaction, and the result syncs back through this collection.
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
		jobPostings,
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
