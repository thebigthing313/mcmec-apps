alter table "public"."notices" drop column "publish_at";

alter table "public"."notices" add column "is_published" boolean not null default false;


