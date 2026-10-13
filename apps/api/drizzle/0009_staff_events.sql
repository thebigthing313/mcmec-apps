CREATE TABLE "staff_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"starts_on" date NOT NULL,
	"ends_on" date,
	"start_time" time,
	"end_time" time,
	"location" text,
	"url" text,
	"is_cancelled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staff_events_ends_after_starts" CHECK ("staff_events"."ends_on" is null or "staff_events"."ends_on" >= "staff_events"."starts_on"),
	CONSTRAINT "staff_events_end_time_needs_start_time" CHECK ("staff_events"."end_time" is null or "staff_events"."start_time" is not null),
	CONSTRAINT "staff_events_single_day_end_after_start" CHECK ("staff_events"."end_time" is null or "staff_events"."ends_on" is not null or "staff_events"."end_time" > "staff_events"."start_time")
);
