drop trigger if exists "profile_id_to_metadata_trigger" on "public"."user_profiles";

drop trigger if exists "updated_user_profiles" on "public"."user_profiles";

drop policy "select: all authenticated users" on "public"."user_profiles";

revoke delete on table "public"."user_profiles" from "anon";

revoke insert on table "public"."user_profiles" from "anon";

revoke references on table "public"."user_profiles" from "anon";

revoke select on table "public"."user_profiles" from "anon";

revoke trigger on table "public"."user_profiles" from "anon";

revoke truncate on table "public"."user_profiles" from "anon";

revoke update on table "public"."user_profiles" from "anon";

revoke delete on table "public"."user_profiles" from "authenticated";

revoke insert on table "public"."user_profiles" from "authenticated";

revoke references on table "public"."user_profiles" from "authenticated";

revoke select on table "public"."user_profiles" from "authenticated";

revoke trigger on table "public"."user_profiles" from "authenticated";

revoke truncate on table "public"."user_profiles" from "authenticated";

revoke update on table "public"."user_profiles" from "authenticated";

revoke delete on table "public"."user_profiles" from "service_role";

revoke insert on table "public"."user_profiles" from "service_role";

revoke references on table "public"."user_profiles" from "service_role";

revoke select on table "public"."user_profiles" from "service_role";

revoke trigger on table "public"."user_profiles" from "service_role";

revoke truncate on table "public"."user_profiles" from "service_role";

revoke update on table "public"."user_profiles" from "service_role";

alter table "public"."user_profiles" drop constraint "user_profiles_created_by_fkey";

alter table "public"."user_profiles" drop constraint "user_profiles_updated_by_fkey";

alter table "public"."user_profiles" drop constraint "user_profiles_user_id_fkey";

alter table "public"."user_profiles" drop constraint "user_profiles_pkey";

drop index if exists "public"."user_profiles_pkey";

drop table "public"."user_profiles";


  create table "public"."employees" (
    "id" uuid not null default gen_random_uuid(),
    "email" text not null,
    "user_id" uuid,
    "display_name" text not null,
    "display_title" text,
    "created_at" timestamp with time zone not null default now(),
    "created_by" uuid,
    "updated_at" timestamp with time zone not null default now(),
    "updated_by" uuid
      );


alter table "public"."employees" enable row level security;

CREATE UNIQUE INDEX employees_email_key ON public.employees USING btree (email);

CREATE UNIQUE INDEX employees_pkey ON public.employees USING btree (id);

alter table "public"."employees" add constraint "employees_pkey" PRIMARY KEY using index "employees_pkey";

alter table "public"."employees" add constraint "employees_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."employees" validate constraint "employees_created_by_fkey";

alter table "public"."employees" add constraint "employees_email_key" UNIQUE using index "employees_email_key";

alter table "public"."employees" add constraint "employees_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."employees" validate constraint "employees_updated_by_fkey";

alter table "public"."employees" add constraint "employees_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."employees" validate constraint "employees_user_id_fkey";

grant delete on table "public"."employees" to "anon";

grant insert on table "public"."employees" to "anon";

grant references on table "public"."employees" to "anon";

grant select on table "public"."employees" to "anon";

grant trigger on table "public"."employees" to "anon";

grant truncate on table "public"."employees" to "anon";

grant update on table "public"."employees" to "anon";

grant delete on table "public"."employees" to "authenticated";

grant insert on table "public"."employees" to "authenticated";

grant references on table "public"."employees" to "authenticated";

grant select on table "public"."employees" to "authenticated";

grant trigger on table "public"."employees" to "authenticated";

grant truncate on table "public"."employees" to "authenticated";

grant update on table "public"."employees" to "authenticated";

grant delete on table "public"."employees" to "service_role";

grant insert on table "public"."employees" to "service_role";

grant references on table "public"."employees" to "service_role";

grant select on table "public"."employees" to "service_role";

grant trigger on table "public"."employees" to "service_role";

grant truncate on table "public"."employees" to "service_role";

grant update on table "public"."employees" to "service_role";


  create policy "select: all authenticated users"
  on "public"."employees"
  as permissive
  for select
  to authenticated
using (true);


-- Drop the old profile_id_to_metadata function (no longer needed)
DROP FUNCTION IF EXISTS private.profile_id_to_metadata();

-- Create employee_id_to_metadata trigger function
CREATE OR REPLACE FUNCTION private.employee_id_to_metadata()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
AS $function$
DECLARE
  _user_id uuid;
  _employee_id uuid;
  _current_metadata jsonb;
BEGIN
  IF TG_OP = 'DELETE' THEN
    _user_id := OLD.user_id;
    _employee_id := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.user_id IS DISTINCT FROM NEW.user_id AND OLD.user_id IS NOT NULL THEN
      SELECT raw_app_meta_data INTO _current_metadata
      FROM auth.users WHERE id = OLD.user_id;
      IF _current_metadata IS NOT NULL THEN
        UPDATE auth.users
        SET raw_app_meta_data = _current_metadata - 'employee_id',
            updated_at = now()
        WHERE id = OLD.user_id;
      END IF;
    END IF;
    _user_id := NEW.user_id;
    _employee_id := NEW.id;
  ELSE
    _user_id := NEW.user_id;
    _employee_id := NEW.id;
  END IF;

  IF _user_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;

  SELECT raw_app_meta_data INTO _current_metadata
  FROM auth.users WHERE id = _user_id;

  IF _current_metadata IS NULL THEN
    _current_metadata := '{}'::jsonb;
  END IF;

  IF _employee_id IS NOT NULL AND (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    _current_metadata := jsonb_set(_current_metadata, '{employee_id}', to_jsonb(_employee_id::text), true);
  ELSE
    _current_metadata := _current_metadata - 'employee_id';
  END IF;

  UPDATE auth.users
  SET raw_app_meta_data = _current_metadata, updated_at = now()
  WHERE id = _user_id;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER employee_id_to_metadata_trigger AFTER INSERT OR DELETE OR UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION private.employee_id_to_metadata();

CREATE TRIGGER updated_employees BEFORE INSERT OR UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.set_audit_fields();


