
  create table "public"."meetings" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "meeting_at" timestamp with time zone not null,
    "is_cancelled" boolean not null default false,
    "agenda_url" text,
    "minutes_url" text,
    "notes" text,
    "created_at" timestamp with time zone not null default now(),
    "created_by" uuid,
    "updated_at" timestamp with time zone not null default now(),
    "updated_by" uuid
      );


alter table "public"."meetings" enable row level security;

CREATE UNIQUE INDEX meetings_pkey ON public.meetings USING btree (id);

alter table "public"."meetings" add constraint "meetings_pkey" PRIMARY KEY using index "meetings_pkey";

alter table "public"."meetings" add constraint "meetings_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."meetings" validate constraint "meetings_created_by_fkey";

alter table "public"."meetings" add constraint "meetings_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."meetings" validate constraint "meetings_updated_by_fkey";

grant delete on table "public"."meetings" to "anon";

grant insert on table "public"."meetings" to "anon";

grant references on table "public"."meetings" to "anon";

grant select on table "public"."meetings" to "anon";

grant trigger on table "public"."meetings" to "anon";

grant truncate on table "public"."meetings" to "anon";

grant update on table "public"."meetings" to "anon";

grant delete on table "public"."meetings" to "authenticated";

grant insert on table "public"."meetings" to "authenticated";

grant references on table "public"."meetings" to "authenticated";

grant select on table "public"."meetings" to "authenticated";

grant trigger on table "public"."meetings" to "authenticated";

grant truncate on table "public"."meetings" to "authenticated";

grant update on table "public"."meetings" to "authenticated";

grant delete on table "public"."meetings" to "service_role";

grant insert on table "public"."meetings" to "service_role";

grant references on table "public"."meetings" to "service_role";

grant select on table "public"."meetings" to "service_role";

grant trigger on table "public"."meetings" to "service_role";

grant truncate on table "public"."meetings" to "service_role";

grant update on table "public"."meetings" to "service_role";


  create policy "delete: public_notices permission"
  on "public"."meetings"
  as permissive
  for delete
  to authenticated
using (public.has_permission('public_notices'::text));



  create policy "insert: public_notices permission"
  on "public"."meetings"
  as permissive
  for insert
  to authenticated
with check (public.has_permission('public_notices'::text));



  create policy "select: allow all"
  on "public"."meetings"
  as permissive
  for select
  to public
using (true);



  create policy "update: public_notices permission"
  on "public"."meetings"
  as permissive
  for update
  to authenticated
using (public.has_permission('public_notices'::text))
with check (public.has_permission('public_notices'::text));


CREATE TRIGGER updated_meetings BEFORE INSERT OR UPDATE ON public.meetings FOR EACH ROW EXECUTE FUNCTION public.set_audit_fields();


