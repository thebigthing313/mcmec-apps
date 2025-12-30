
  create table "public"."notice_types" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "description" text,
    "created_at" timestamp with time zone not null default now(),
    "created_by" uuid,
    "updated_at" timestamp with time zone not null default now(),
    "updated_by" uuid
      );


alter table "public"."notice_types" enable row level security;


  create table "public"."notices" (
    "id" uuid not null default gen_random_uuid(),
    "notice_type_id" uuid not null,
    "title" text not null,
    "content" jsonb not null,
    "publish_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "created_by" uuid,
    "updated_at" timestamp with time zone not null default now(),
    "updated_by" uuid
      );


alter table "public"."notices" enable row level security;

CREATE UNIQUE INDEX notice_types_name_key ON public.notice_types USING btree (name);

CREATE UNIQUE INDEX notice_types_pkey ON public.notice_types USING btree (id);

CREATE UNIQUE INDEX notices_pkey ON public.notices USING btree (id);

alter table "public"."notice_types" add constraint "notice_types_pkey" PRIMARY KEY using index "notice_types_pkey";

alter table "public"."notices" add constraint "notices_pkey" PRIMARY KEY using index "notices_pkey";

alter table "public"."notice_types" add constraint "notice_types_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."notice_types" validate constraint "notice_types_created_by_fkey";

alter table "public"."notice_types" add constraint "notice_types_name_key" UNIQUE using index "notice_types_name_key";

alter table "public"."notice_types" add constraint "notice_types_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."notice_types" validate constraint "notice_types_updated_by_fkey";

alter table "public"."notices" add constraint "notices_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."notices" validate constraint "notices_created_by_fkey";

alter table "public"."notices" add constraint "notices_notice_type_id_fkey" FOREIGN KEY (notice_type_id) REFERENCES public.notice_types(id) ON DELETE RESTRICT not valid;

alter table "public"."notices" validate constraint "notices_notice_type_id_fkey";

alter table "public"."notices" add constraint "notices_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."notices" validate constraint "notices_updated_by_fkey";

grant delete on table "public"."notice_types" to "anon";

grant insert on table "public"."notice_types" to "anon";

grant references on table "public"."notice_types" to "anon";

grant select on table "public"."notice_types" to "anon";

grant trigger on table "public"."notice_types" to "anon";

grant truncate on table "public"."notice_types" to "anon";

grant update on table "public"."notice_types" to "anon";

grant delete on table "public"."notice_types" to "authenticated";

grant insert on table "public"."notice_types" to "authenticated";

grant references on table "public"."notice_types" to "authenticated";

grant select on table "public"."notice_types" to "authenticated";

grant trigger on table "public"."notice_types" to "authenticated";

grant truncate on table "public"."notice_types" to "authenticated";

grant update on table "public"."notice_types" to "authenticated";

grant delete on table "public"."notice_types" to "service_role";

grant insert on table "public"."notice_types" to "service_role";

grant references on table "public"."notice_types" to "service_role";

grant select on table "public"."notice_types" to "service_role";

grant trigger on table "public"."notice_types" to "service_role";

grant truncate on table "public"."notice_types" to "service_role";

grant update on table "public"."notice_types" to "service_role";

grant delete on table "public"."notices" to "anon";

grant insert on table "public"."notices" to "anon";

grant references on table "public"."notices" to "anon";

grant select on table "public"."notices" to "anon";

grant trigger on table "public"."notices" to "anon";

grant truncate on table "public"."notices" to "anon";

grant update on table "public"."notices" to "anon";

grant delete on table "public"."notices" to "authenticated";

grant insert on table "public"."notices" to "authenticated";

grant references on table "public"."notices" to "authenticated";

grant select on table "public"."notices" to "authenticated";

grant trigger on table "public"."notices" to "authenticated";

grant truncate on table "public"."notices" to "authenticated";

grant update on table "public"."notices" to "authenticated";

grant delete on table "public"."notices" to "service_role";

grant insert on table "public"."notices" to "service_role";

grant references on table "public"."notices" to "service_role";

grant select on table "public"."notices" to "service_role";

grant trigger on table "public"."notices" to "service_role";

grant truncate on table "public"."notices" to "service_role";

grant update on table "public"."notices" to "service_role";


  create policy "delete: public_notices permission"
  on "public"."notice_types"
  as permissive
  for delete
  to authenticated
using (public.has_permission('public_notices'::text));



  create policy "insert: public_notices permission"
  on "public"."notice_types"
  as permissive
  for insert
  to authenticated
with check (public.has_permission('public_notices'::text));



  create policy "select: allow all"
  on "public"."notice_types"
  as permissive
  for select
  to public
using (true);



  create policy "update: public_notices permission"
  on "public"."notice_types"
  as permissive
  for update
  to authenticated
using (public.has_permission('public_notices'::text))
with check (public.has_permission('public_notices'::text));



  create policy "delete: public_notices permission"
  on "public"."notices"
  as permissive
  for delete
  to authenticated
using (public.has_permission('public_notices'::text));



  create policy "insert: public_notices permission"
  on "public"."notices"
  as permissive
  for insert
  to authenticated
with check (public.has_permission('public_notices'::text));



  create policy "select: allow all"
  on "public"."notices"
  as permissive
  for select
  to public
using (true);



  create policy "update: public_notices permission"
  on "public"."notices"
  as permissive
  for update
  to authenticated
using (public.has_permission('public_notices'::text))
with check (public.has_permission('public_notices'::text));



