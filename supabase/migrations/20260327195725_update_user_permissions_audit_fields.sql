alter table "public"."user_permissions" drop constraint "user_permissions_created_by_fkey";

alter table "public"."user_permissions" add column "updated_at" timestamp with time zone not null default now();

alter table "public"."user_permissions" add column "updated_by" uuid;

alter table "public"."user_permissions" alter column "created_by" drop default;

alter table "public"."user_permissions" add constraint "user_permissions_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."user_permissions" validate constraint "user_permissions_updated_by_fkey";

alter table "public"."user_permissions" add constraint "user_permissions_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."user_permissions" validate constraint "user_permissions_created_by_fkey";

CREATE TRIGGER updated_user_permissions BEFORE INSERT OR UPDATE ON public.user_permissions FOR EACH ROW EXECUTE FUNCTION public.set_audit_fields();


