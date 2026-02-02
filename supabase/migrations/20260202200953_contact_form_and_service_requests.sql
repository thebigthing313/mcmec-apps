
  create table "public"."adult_mosquito_complaints" (
    "id" uuid not null default gen_random_uuid(),
    "full_name" text not null,
    "phone" text not null,
    "email" text,
    "address_line_1" text not null,
    "address_line_2" text,
    "zip_code_id" uuid not null,
    "is_rear_of_property" boolean not null default false,
    "is_front_of_property" boolean not null default false,
    "is_general_vicinity" boolean not null default false,
    "is_dusk_dawn" boolean not null default false,
    "is_daytime" boolean not null default false,
    "is_nighttime" boolean not null default false,
    "is_accessible" boolean not null default true,
    "is_processed" boolean not null default false,
    "additional_details" text,
    "created_at" timestamp with time zone not null default now(),
    "created_by" uuid,
    "updated_at" timestamp with time zone not null default now(),
    "updated_by" uuid
      );


alter table "public"."adult_mosquito_complaints" enable row level security;


  create table "public"."contact_form_submissions" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "email" text not null,
    "subject" text not null,
    "message" text not null,
    "is_closed" boolean not null default false,
    "created_at" timestamp with time zone not null default now(),
    "created_by" uuid,
    "updated_at" timestamp with time zone not null default now(),
    "updated_by" uuid
      );


alter table "public"."contact_form_submissions" enable row level security;


  create table "public"."mosquito_fish_requests" (
    "id" uuid not null default gen_random_uuid(),
    "full_name" text not null,
    "phone" text not null,
    "email" text,
    "address_line_1" text not null,
    "address_line_2" text,
    "zip_code_id" uuid not null,
    "location_of_water_body" text not null,
    "type_of_water_body" text not null,
    "is_processed" boolean not null default false,
    "additional_details" text,
    "created_at" timestamp with time zone not null default now(),
    "created_by" uuid,
    "updated_at" timestamp with time zone not null default now(),
    "updated_by" uuid
      );


alter table "public"."mosquito_fish_requests" enable row level security;


  create table "public"."water_management_requests" (
    "id" uuid not null default gen_random_uuid(),
    "full_name" text not null,
    "phone" text not null,
    "email" text,
    "address_line_1" text not null,
    "address_line_2" text,
    "zip_code_id" uuid not null,
    "location_of_concern" text not null,
    "is_on_my_property" boolean not null default false,
    "is_on_neighbor_property" boolean not null default false,
    "is_on_public_property" boolean not null default false,
    "other_location_description" text,
    "is_processed" boolean not null default false,
    "additional_details" text,
    "created_at" timestamp with time zone not null default now(),
    "created_by" uuid,
    "updated_at" timestamp with time zone not null default now(),
    "updated_by" uuid
      );


alter table "public"."water_management_requests" enable row level security;


  create table "public"."zip_codes" (
    "id" uuid not null default gen_random_uuid(),
    "code" text not null,
    "city" text not null,
    "state" text not null,
    "created_at" timestamp with time zone not null default now(),
    "created_by" uuid,
    "updated_at" timestamp with time zone not null default now(),
    "updated_by" uuid
      );


alter table "public"."zip_codes" enable row level security;

CREATE UNIQUE INDEX adult_mosquito_complaints_pkey ON public.adult_mosquito_complaints USING btree (id);

CREATE UNIQUE INDEX contact_form_submissions_pkey ON public.contact_form_submissions USING btree (id);

CREATE UNIQUE INDEX mosquito_fish_requests_pkey ON public.mosquito_fish_requests USING btree (id);

CREATE UNIQUE INDEX water_management_requests_pkey ON public.water_management_requests USING btree (id);

CREATE UNIQUE INDEX zip_codes_code_key ON public.zip_codes USING btree (code);

CREATE UNIQUE INDEX zip_codes_pkey ON public.zip_codes USING btree (id);

alter table "public"."adult_mosquito_complaints" add constraint "adult_mosquito_complaints_pkey" PRIMARY KEY using index "adult_mosquito_complaints_pkey";

alter table "public"."contact_form_submissions" add constraint "contact_form_submissions_pkey" PRIMARY KEY using index "contact_form_submissions_pkey";

alter table "public"."mosquito_fish_requests" add constraint "mosquito_fish_requests_pkey" PRIMARY KEY using index "mosquito_fish_requests_pkey";

alter table "public"."water_management_requests" add constraint "water_management_requests_pkey" PRIMARY KEY using index "water_management_requests_pkey";

alter table "public"."zip_codes" add constraint "zip_codes_pkey" PRIMARY KEY using index "zip_codes_pkey";

alter table "public"."adult_mosquito_complaints" add constraint "adult_mosquito_complaints_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."adult_mosquito_complaints" validate constraint "adult_mosquito_complaints_created_by_fkey";

alter table "public"."adult_mosquito_complaints" add constraint "adult_mosquito_complaints_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."adult_mosquito_complaints" validate constraint "adult_mosquito_complaints_updated_by_fkey";

alter table "public"."adult_mosquito_complaints" add constraint "adult_mosquito_complaints_zip_code_id_fkey" FOREIGN KEY (zip_code_id) REFERENCES public.zip_codes(id) ON DELETE RESTRICT not valid;

alter table "public"."adult_mosquito_complaints" validate constraint "adult_mosquito_complaints_zip_code_id_fkey";

alter table "public"."contact_form_submissions" add constraint "contact_form_submissions_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."contact_form_submissions" validate constraint "contact_form_submissions_created_by_fkey";

alter table "public"."contact_form_submissions" add constraint "contact_form_submissions_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."contact_form_submissions" validate constraint "contact_form_submissions_updated_by_fkey";

alter table "public"."mosquito_fish_requests" add constraint "mosquito_fish_requests_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."mosquito_fish_requests" validate constraint "mosquito_fish_requests_created_by_fkey";

alter table "public"."mosquito_fish_requests" add constraint "mosquito_fish_requests_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."mosquito_fish_requests" validate constraint "mosquito_fish_requests_updated_by_fkey";

alter table "public"."mosquito_fish_requests" add constraint "mosquito_fish_requests_zip_code_id_fkey" FOREIGN KEY (zip_code_id) REFERENCES public.zip_codes(id) ON DELETE RESTRICT not valid;

alter table "public"."mosquito_fish_requests" validate constraint "mosquito_fish_requests_zip_code_id_fkey";

alter table "public"."water_management_requests" add constraint "water_management_requests_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."water_management_requests" validate constraint "water_management_requests_created_by_fkey";

alter table "public"."water_management_requests" add constraint "water_management_requests_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."water_management_requests" validate constraint "water_management_requests_updated_by_fkey";

alter table "public"."water_management_requests" add constraint "water_management_requests_zip_code_id_fkey" FOREIGN KEY (zip_code_id) REFERENCES public.zip_codes(id) ON DELETE RESTRICT not valid;

alter table "public"."water_management_requests" validate constraint "water_management_requests_zip_code_id_fkey";

alter table "public"."zip_codes" add constraint "zip_codes_code_key" UNIQUE using index "zip_codes_code_key";

alter table "public"."zip_codes" add constraint "zip_codes_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."zip_codes" validate constraint "zip_codes_created_by_fkey";

alter table "public"."zip_codes" add constraint "zip_codes_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."zip_codes" validate constraint "zip_codes_updated_by_fkey";

grant delete on table "public"."adult_mosquito_complaints" to "anon";

grant insert on table "public"."adult_mosquito_complaints" to "anon";

grant references on table "public"."adult_mosquito_complaints" to "anon";

grant select on table "public"."adult_mosquito_complaints" to "anon";

grant trigger on table "public"."adult_mosquito_complaints" to "anon";

grant truncate on table "public"."adult_mosquito_complaints" to "anon";

grant update on table "public"."adult_mosquito_complaints" to "anon";

grant delete on table "public"."adult_mosquito_complaints" to "authenticated";

grant insert on table "public"."adult_mosquito_complaints" to "authenticated";

grant references on table "public"."adult_mosquito_complaints" to "authenticated";

grant select on table "public"."adult_mosquito_complaints" to "authenticated";

grant trigger on table "public"."adult_mosquito_complaints" to "authenticated";

grant truncate on table "public"."adult_mosquito_complaints" to "authenticated";

grant update on table "public"."adult_mosquito_complaints" to "authenticated";

grant delete on table "public"."adult_mosquito_complaints" to "service_role";

grant insert on table "public"."adult_mosquito_complaints" to "service_role";

grant references on table "public"."adult_mosquito_complaints" to "service_role";

grant select on table "public"."adult_mosquito_complaints" to "service_role";

grant trigger on table "public"."adult_mosquito_complaints" to "service_role";

grant truncate on table "public"."adult_mosquito_complaints" to "service_role";

grant update on table "public"."adult_mosquito_complaints" to "service_role";

grant delete on table "public"."contact_form_submissions" to "anon";

grant insert on table "public"."contact_form_submissions" to "anon";

grant references on table "public"."contact_form_submissions" to "anon";

grant select on table "public"."contact_form_submissions" to "anon";

grant trigger on table "public"."contact_form_submissions" to "anon";

grant truncate on table "public"."contact_form_submissions" to "anon";

grant update on table "public"."contact_form_submissions" to "anon";

grant delete on table "public"."contact_form_submissions" to "authenticated";

grant insert on table "public"."contact_form_submissions" to "authenticated";

grant references on table "public"."contact_form_submissions" to "authenticated";

grant select on table "public"."contact_form_submissions" to "authenticated";

grant trigger on table "public"."contact_form_submissions" to "authenticated";

grant truncate on table "public"."contact_form_submissions" to "authenticated";

grant update on table "public"."contact_form_submissions" to "authenticated";

grant delete on table "public"."contact_form_submissions" to "service_role";

grant insert on table "public"."contact_form_submissions" to "service_role";

grant references on table "public"."contact_form_submissions" to "service_role";

grant select on table "public"."contact_form_submissions" to "service_role";

grant trigger on table "public"."contact_form_submissions" to "service_role";

grant truncate on table "public"."contact_form_submissions" to "service_role";

grant update on table "public"."contact_form_submissions" to "service_role";

grant delete on table "public"."mosquito_fish_requests" to "anon";

grant insert on table "public"."mosquito_fish_requests" to "anon";

grant references on table "public"."mosquito_fish_requests" to "anon";

grant select on table "public"."mosquito_fish_requests" to "anon";

grant trigger on table "public"."mosquito_fish_requests" to "anon";

grant truncate on table "public"."mosquito_fish_requests" to "anon";

grant update on table "public"."mosquito_fish_requests" to "anon";

grant delete on table "public"."mosquito_fish_requests" to "authenticated";

grant insert on table "public"."mosquito_fish_requests" to "authenticated";

grant references on table "public"."mosquito_fish_requests" to "authenticated";

grant select on table "public"."mosquito_fish_requests" to "authenticated";

grant trigger on table "public"."mosquito_fish_requests" to "authenticated";

grant truncate on table "public"."mosquito_fish_requests" to "authenticated";

grant update on table "public"."mosquito_fish_requests" to "authenticated";

grant delete on table "public"."mosquito_fish_requests" to "service_role";

grant insert on table "public"."mosquito_fish_requests" to "service_role";

grant references on table "public"."mosquito_fish_requests" to "service_role";

grant select on table "public"."mosquito_fish_requests" to "service_role";

grant trigger on table "public"."mosquito_fish_requests" to "service_role";

grant truncate on table "public"."mosquito_fish_requests" to "service_role";

grant update on table "public"."mosquito_fish_requests" to "service_role";

grant delete on table "public"."water_management_requests" to "anon";

grant insert on table "public"."water_management_requests" to "anon";

grant references on table "public"."water_management_requests" to "anon";

grant select on table "public"."water_management_requests" to "anon";

grant trigger on table "public"."water_management_requests" to "anon";

grant truncate on table "public"."water_management_requests" to "anon";

grant update on table "public"."water_management_requests" to "anon";

grant delete on table "public"."water_management_requests" to "authenticated";

grant insert on table "public"."water_management_requests" to "authenticated";

grant references on table "public"."water_management_requests" to "authenticated";

grant select on table "public"."water_management_requests" to "authenticated";

grant trigger on table "public"."water_management_requests" to "authenticated";

grant truncate on table "public"."water_management_requests" to "authenticated";

grant update on table "public"."water_management_requests" to "authenticated";

grant delete on table "public"."water_management_requests" to "service_role";

grant insert on table "public"."water_management_requests" to "service_role";

grant references on table "public"."water_management_requests" to "service_role";

grant select on table "public"."water_management_requests" to "service_role";

grant trigger on table "public"."water_management_requests" to "service_role";

grant truncate on table "public"."water_management_requests" to "service_role";

grant update on table "public"."water_management_requests" to "service_role";

grant delete on table "public"."zip_codes" to "anon";

grant insert on table "public"."zip_codes" to "anon";

grant references on table "public"."zip_codes" to "anon";

grant select on table "public"."zip_codes" to "anon";

grant trigger on table "public"."zip_codes" to "anon";

grant truncate on table "public"."zip_codes" to "anon";

grant update on table "public"."zip_codes" to "anon";

grant delete on table "public"."zip_codes" to "authenticated";

grant insert on table "public"."zip_codes" to "authenticated";

grant references on table "public"."zip_codes" to "authenticated";

grant select on table "public"."zip_codes" to "authenticated";

grant trigger on table "public"."zip_codes" to "authenticated";

grant truncate on table "public"."zip_codes" to "authenticated";

grant update on table "public"."zip_codes" to "authenticated";

grant delete on table "public"."zip_codes" to "service_role";

grant insert on table "public"."zip_codes" to "service_role";

grant references on table "public"."zip_codes" to "service_role";

grant select on table "public"."zip_codes" to "service_role";

grant trigger on table "public"."zip_codes" to "service_role";

grant truncate on table "public"."zip_codes" to "service_role";

grant update on table "public"."zip_codes" to "service_role";


  create policy "delete: requires public_notices permission"
  on "public"."adult_mosquito_complaints"
  as permissive
  for delete
  to authenticated
using (public.has_permission('public_notices'::text));



  create policy "insert: requires authenticated user"
  on "public"."adult_mosquito_complaints"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "select: requires public_notices permission"
  on "public"."adult_mosquito_complaints"
  as permissive
  for select
  to authenticated
using (public.has_permission('public_notices'::text));



  create policy "update: requires public_notices permission"
  on "public"."adult_mosquito_complaints"
  as permissive
  for update
  to authenticated
using (public.has_permission('public_notices'::text))
with check (public.has_permission('public_notices'::text));



  create policy "delete: requires public_notices permission"
  on "public"."contact_form_submissions"
  as permissive
  for delete
  to authenticated
using (public.has_permission('public_notices'::text));



  create policy "insert: requires authenticated user"
  on "public"."contact_form_submissions"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "select: requires public_notices permission"
  on "public"."contact_form_submissions"
  as permissive
  for select
  to authenticated
using (public.has_permission('public_notices'::text));



  create policy "update: requires public_notices permission"
  on "public"."contact_form_submissions"
  as permissive
  for update
  to authenticated
using (public.has_permission('public_notices'::text))
with check (public.has_permission('public_notices'::text));



  create policy "delete: requires public_notices permission"
  on "public"."mosquito_fish_requests"
  as permissive
  for delete
  to authenticated
using (public.has_permission('public_notices'::text));



  create policy "insert: requires authenticated user"
  on "public"."mosquito_fish_requests"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "select: requires public_notices permission"
  on "public"."mosquito_fish_requests"
  as permissive
  for select
  to authenticated
using (public.has_permission('public_notices'::text));



  create policy "update: requires public_notices permission"
  on "public"."mosquito_fish_requests"
  as permissive
  for update
  to authenticated
using (public.has_permission('public_notices'::text))
with check (public.has_permission('public_notices'::text));



  create policy "delete: requires public_notices permission"
  on "public"."water_management_requests"
  as permissive
  for delete
  to authenticated
using (public.has_permission('public_notices'::text));



  create policy "insert: requires authenticated user"
  on "public"."water_management_requests"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "select: requires public_notices permission"
  on "public"."water_management_requests"
  as permissive
  for select
  to authenticated
using (public.has_permission('public_notices'::text));



  create policy "update: requires public_notices permission"
  on "public"."water_management_requests"
  as permissive
  for update
  to authenticated
using (public.has_permission('public_notices'::text))
with check (public.has_permission('public_notices'::text));



  create policy "select: all"
  on "public"."zip_codes"
  as permissive
  for select
  to public
using (true);


CREATE TRIGGER updated_adult_mosquito_complaints BEFORE INSERT OR UPDATE ON public.adult_mosquito_complaints FOR EACH ROW EXECUTE FUNCTION public.set_audit_fields();

CREATE TRIGGER updated_contact_form_submissions BEFORE INSERT OR UPDATE ON public.contact_form_submissions FOR EACH ROW EXECUTE FUNCTION public.set_audit_fields();

CREATE TRIGGER updated_mosquito_fish_requests BEFORE INSERT OR UPDATE ON public.mosquito_fish_requests FOR EACH ROW EXECUTE FUNCTION public.set_audit_fields();

CREATE TRIGGER updated_water_management_requests BEFORE INSERT OR UPDATE ON public.water_management_requests FOR EACH ROW EXECUTE FUNCTION public.set_audit_fields();

CREATE TRIGGER updated_zip_codes BEFORE INSERT OR UPDATE ON public.zip_codes FOR EACH ROW EXECUTE FUNCTION public.set_audit_fields();


