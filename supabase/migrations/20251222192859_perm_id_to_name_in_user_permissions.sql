alter table "public"."user_permissions" drop constraint "user_permissions_permission_id_fkey";

alter table "public"."user_permissions" drop column "permission_id";

alter table "public"."user_permissions" add column "permission_name" text not null;

alter table "public"."user_permissions" add constraint "user_permissions_permission_name_fkey" FOREIGN KEY (permission_name) REFERENCES public.permissions(permission_name) ON DELETE CASCADE not valid;

alter table "public"."user_permissions" validate constraint "user_permissions_permission_name_fkey";


