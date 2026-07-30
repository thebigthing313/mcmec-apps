// Drizzle schema — target schema for the Railway backend.
//
// Conventions (locked during schema review):
//   - uuid ids (gen_random_uuid); snake_case columns; camelCase TS keys so Better Auth's
//     drizzle adapter matches its model fields (e.g. `emailVerified` -> `email_verified`).
//   - Every carried table keeps created_at/updated_at (updated_at bumped by the set_updated_at
//     trigger — see triggers.sql), and DROPS created_by/updated_by (the "who/when history"
//     now lives in audit_log).
//   - Functions, triggers, grants, and the append-only hardening are in triggers.sql (Drizzle
//     can't express them).

import { sql } from "drizzle-orm";
import {
	bigint,
	boolean,
	check,
	date,
	index,
	integer,
	jsonb,
	numeric,
	pgEnum,
	pgTable,
	primaryKey,
	text,
	time,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";

// ── shared column sets ───────────────────────────────────────────────────────
// App tables: updated_at is bumped by the set_updated_at DB trigger (any write path).
const timestamps = {
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
};

// Better Auth tables get NO DB trigger; $onUpdate matches Better Auth's generated schema so
// updated_at bumps on its adapter writes.
const authTimestamps = {
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
};

// ── enums ────────────────────────────────────────────────────────────────────
export const sprayScheduleStatus = pgEnum("spray_schedule_status", [
	"scheduled",
	"delayed",
	"cancelled",
	"completed",
]);
export const requestStatus = pgEnum("request_status", [
	"new",
	"in_progress",
	"resolved",
]);
export const auditOperation = pgEnum("audit_operation", [
	"INSERT",
	"UPDATE",
	"DELETE",
]);

// ══ Better Auth core (+ admin plugin fields) ═════════════════════════════════
// Owned by Better Auth at runtime (mapped in auth.ts); declared here so app tables can FK to
// users and so drizzle-kit manages the DDL. Reconciled against `@better-auth/cli generate`:
// deliberate deviations = plural names, uuid ids, timestamptz.
export const users = pgTable("users", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").notNull().default(false),
	image: text("image"), // Better Auth core field
	// admin plugin
	role: text("role"), // comma-separated: manage_website,manage_employees,manage_users
	banned: boolean("banned").notNull().default(false),
	banReason: text("ban_reason"),
	banExpires: timestamp("ban_expires", { withTimezone: true }),
	...authTimestamps,
});

export const sessions = pgTable(
	"sessions",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		token: text("token").notNull().unique(),
		expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		impersonatedBy: uuid("impersonated_by").references(() => users.id, {
			onDelete: "set null",
		}), // admin plugin
		...authTimestamps,
	},
	(t) => [index("sessions_user_id_idx").on(t.userId)],
);

export const accounts = pgTable(
	"accounts",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		accountId: text("account_id").notNull(),
		providerId: text("provider_id").notNull(),
		password: text("password"), // credential provider (bcrypt/scrypt)
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		idToken: text("id_token"),
		accessTokenExpiresAt: timestamp("access_token_expires_at", {
			withTimezone: true,
		}),
		refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
			withTimezone: true,
		}),
		scope: text("scope"),
		...authTimestamps,
	},
	(t) => [index("accounts_user_id_idx").on(t.userId)],
);

export const verifications = pgTable(
	"verifications",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		identifier: text("identifier").notNull(),
		value: text("value").notNull(),
		expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
		...authTimestamps,
	},
	(t) => [index("verifications_identifier_idx").on(t.identifier)],
);

// ══ Audit ════════════════════════════════════════════════════════════════════
// Append-only. Inserted only by the SECURITY DEFINER log_mutation() trigger (data tables)
// and by app-layer Better Auth hooks (users). App role gets SELECT only — see triggers.sql.
export const auditLog = pgTable(
	"audit_log",
	{
		id: bigint("id", { mode: "number" })
			.primaryKey()
			.generatedAlwaysAsIdentity(),
		occurredAt: timestamp("occurred_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		tableName: text("table_name").notNull(),
		recordId: uuid("record_id"),
		operation: auditOperation("operation").notNull(),
		actorUserId: uuid("actor_user_id").references(() => users.id, {
			onDelete: "set null",
		}),
		actorEmail: text("actor_email"), // immutable snapshot; survives user deletion
		oldValues: jsonb("old_values"),
		newValues: jsonb("new_values"),
		requestId: text("request_id"),
		ipAddress: text("ip_address"),
	},
	(t) => [
		index("audit_log_table_record_idx").on(
			t.tableName,
			t.recordId,
			t.occurredAt,
		),
		index("audit_log_actor_idx").on(t.actorUserId, t.occurredAt),
	],
);

// ══ People ═══════════════════════════════════════════════════════════════════
export const employees = pgTable("employees", {
	id: uuid("id").primaryKey().defaultRandom(),
	email: text("email").notNull().unique(),
	userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }), // NULL = no login
	displayName: text("display_name").notNull(),
	displayTitle: text("display_title"),
	...timestamps,
});

// ══ Lookups ══════════════════════════════════════════════════════════════════
export const zipCodes = pgTable("zip_codes", {
	id: uuid("id").primaryKey().defaultRandom(),
	code: text("code").notNull().unique(),
	city: text("city").notNull(),
	state: text("state").notNull(),
	...timestamps,
});

export const municipalities = pgTable("municipalities", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull().unique(),
	...timestamps,
});

export const noticeTypes = pgTable("notice_types", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull().unique(),
	description: text("description"),
	...timestamps,
});

export const documentTypes = pgTable("document_types", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull().unique(),
	description: text("description"),
	...timestamps,
});

export const insecticides = pgTable("insecticides", {
	id: uuid("id").primaryKey().defaultRandom(),
	typeName: text("type_name").notNull(),
	activeIngredient: text("active_ingredient").notNull(),
	activeIngredientUrl: text("active_ingredient_url").notNull(),
	tradeName: text("trade_name").notNull(),
	labelUrl: text("label_url").notNull(),
	msdsUrl: text("msds_url").notNull(),
	...timestamps,
});

// ══ Public content ═══════════════════════════════════════════════════════════
export const notices = pgTable("notices", {
	id: uuid("id").primaryKey().defaultRandom(),
	noticeTypeId: uuid("notice_type_id")
		.notNull()
		.references(() => noticeTypes.id, { onDelete: "restrict" }),
	title: text("title").notNull(),
	noticeDate: date("notice_date").notNull(),
	content: jsonb("content").notNull(), // TipTap doc
	isPublished: boolean("is_published").notNull().default(false),
	isArchived: boolean("is_archived").notNull().default(false),
	...timestamps,
});

// Append-only proof-of-posting ledger (website only). Auto-written by the API on publish.
export const noticePostings = pgTable(
	"notice_postings",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		noticeId: uuid("notice_id")
			.notNull()
			.references(() => notices.id, { onDelete: "restrict" }),
		postedAt: timestamp("posted_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		postedBy: uuid("posted_by").references(() => users.id, {
			onDelete: "set null",
		}),
		snapshot: jsonb("snapshot").notNull(), // frozen { title, notice_date, notice_type, content }
	},
	(t) => [index("notice_postings_notice_idx").on(t.noticeId, t.postedAt)],
);

export const meetings = pgTable("meetings", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(),
	location: text("location").notNull(),
	meetingAt: timestamp("meeting_at", { withTimezone: true }).notNull(),
	isCancelled: boolean("is_cancelled").notNull().default(false),
	minutesUrl: text("minutes_url"), // external link
	noticeUrl: text("notice_url"), // external link
	notes: text("notes"),
	...timestamps,
});

export const documents = pgTable("documents", {
	id: uuid("id").primaryKey().defaultRandom(),
	documentTypeId: uuid("document_type_id")
		.notNull()
		.references(() => documentTypes.id, { onDelete: "restrict" }),
	fiscalYear: integer("fiscal_year").notNull(),
	url: text("url").notNull(), // external link
	isPublished: boolean("is_published").notNull().default(false),
	...timestamps,
});

export const spraySchedules = pgTable("spray_schedules", {
	id: uuid("id").primaryKey().defaultRandom(),
	missionDate: date("mission_date").notNull(),
	startTime: time("start_time").notNull(),
	endTime: time("end_time").notNull(),
	rainDate: date("rain_date"),
	areaDescription: text("area_description").notNull(),
	mapUrl: text("map_url"), // external link
	status: sprayScheduleStatus("status").notNull().default("scheduled"),
	insecticideId: uuid("insecticide_id")
		.notNull()
		.references(() => insecticides.id, { onDelete: "restrict" }),
	...timestamps,
});

export const sprayScheduleMunicipalities = pgTable(
	"spray_schedule_municipalities",
	{
		sprayScheduleId: uuid("spray_schedule_id")
			.notNull()
			.references(() => spraySchedules.id, { onDelete: "cascade" }),
		municipalityId: uuid("municipality_id")
			.notNull()
			.references(() => municipalities.id, { onDelete: "restrict" }),
	},
	(t) => [primaryKey({ columns: [t.sprayScheduleId, t.municipalityId] })],
);

// ══ Intake (merged: contact + 3 service requests) ════════════════════════════
export const publicRequests = pgTable(
	"public_requests",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		requestType: text("request_type").notNull(), // general_inquiry | adult_mosquito | water_management | mosquito_fish | ...
		// shared contact block (nullable — general_inquiry uses only name/email)
		name: text("name").notNull(),
		email: text("email"),
		phone: text("phone"),
		addressLine1: text("address_line_1"),
		addressLine2: text("address_line_2"),
		zipCodeId: uuid("zip_code_id").references(() => zipCodes.id, {
			onDelete: "restrict",
		}),
		// variable per-type answers, validated by a Zod discriminated union in the API
		details: jsonb("details").notNull().default(sql`'{}'::jsonb`),
		status: requestStatus("status").notNull().default("new"),
		...timestamps,
	},
	(t) => [
		index("public_requests_type_status_idx").on(
			t.requestType,
			t.status,
			t.createdAt,
		),
		index("public_requests_email_idx").on(t.email),
	],
);

// ══ HR ═══════════════════════════════════════════════════════════════════════
export const jobPostings = pgTable("job_postings", {
	id: uuid("id").primaryKey().defaultRandom(),
	title: text("title").notNull(),
	content: jsonb("content").notNull(),
	publishedAt: timestamp("published_at", { withTimezone: true }),
	isClosed: boolean("is_closed").notNull().default(false),
	...timestamps,
});

// ══ Surveillance ═════════════════════════════════════════════════════════════
export const mosquitoActivityData = pgTable(
	"mosquito_activity_data",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		speciesName: text("species_name").notNull(),
		speciesGroup: text("species_group").notNull(),
		year: integer("year").notNull(),
		weekNumber: integer("week_number").notNull(),
		mosquitoCount: integer("mosquito_count").notNull().default(0),
		rainfallInches: numeric("rainfall_inches", { precision: 5, scale: 2 })
			.notNull()
			.default("0"),
		...timestamps,
	},
	(t) => [
		check(
			"mosquito_activity_week_number_check",
			sql`${t.weekNumber} between 1 and 53`,
		),
	],
);
