
  create table "public"."insecticides" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "type_name" text not null,
    "active_ingredient" text not null,
    "active_ingredient_url" text not null,
    "trade_name" text not null,
    "label_url" text not null,
    "msds_url" text not null,
    "created_at" timestamp with time zone not null default now(),
    "created_by" uuid,
    "updated_at" timestamp with time zone not null default now(),
    "updated_by" uuid
      );


alter table "public"."insecticides" enable row level security;

CREATE UNIQUE INDEX insecticides_pkey ON public.insecticides USING btree (id);

alter table "public"."insecticides" add constraint "insecticides_pkey" PRIMARY KEY using index "insecticides_pkey";

alter table "public"."insecticides" add constraint "insecticides_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."insecticides" validate constraint "insecticides_created_by_fkey";

alter table "public"."insecticides" add constraint "insecticides_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."insecticides" validate constraint "insecticides_updated_by_fkey";

grant delete on table "public"."insecticides" to "anon";

grant insert on table "public"."insecticides" to "anon";

grant references on table "public"."insecticides" to "anon";

grant select on table "public"."insecticides" to "anon";

grant trigger on table "public"."insecticides" to "anon";

grant truncate on table "public"."insecticides" to "anon";

grant update on table "public"."insecticides" to "anon";

grant delete on table "public"."insecticides" to "authenticated";

grant insert on table "public"."insecticides" to "authenticated";

grant references on table "public"."insecticides" to "authenticated";

grant select on table "public"."insecticides" to "authenticated";

grant trigger on table "public"."insecticides" to "authenticated";

grant truncate on table "public"."insecticides" to "authenticated";

grant update on table "public"."insecticides" to "authenticated";

grant delete on table "public"."insecticides" to "service_role";

grant insert on table "public"."insecticides" to "service_role";

grant references on table "public"."insecticides" to "service_role";

grant select on table "public"."insecticides" to "service_role";

grant trigger on table "public"."insecticides" to "service_role";

grant truncate on table "public"."insecticides" to "service_role";

grant update on table "public"."insecticides" to "service_role";


  create policy "delete: public_notices permission"
  on "public"."insecticides"
  as permissive
  for delete
  to authenticated
using (public.has_permission('public_notices'::text));



  create policy "insert: public_notices permission"
  on "public"."insecticides"
  as permissive
  for insert
  to authenticated
with check (public.has_permission('public_notices'::text));



  create policy "select: allow all"
  on "public"."insecticides"
  as permissive
  for select
  to public
using (true);



  create policy "update: public_notices permission"
  on "public"."insecticides"
  as permissive
  for update
  to authenticated
using (public.has_permission('public_notices'::text))
with check (public.has_permission('public_notices'::text));


CREATE TRIGGER updated_insecticides BEFORE INSERT OR UPDATE ON public.insecticides FOR EACH ROW EXECUTE FUNCTION public.set_audit_fields();


