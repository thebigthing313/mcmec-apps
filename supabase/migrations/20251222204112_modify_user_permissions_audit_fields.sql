drop trigger if exists "updated_user_permissions" on "public"."user_permissions";

alter table "public"."user_permissions" drop constraint "user_permissions_created_by_fkey";

alter table "public"."user_permissions" alter column "created_by" set default auth.uid();

alter table "public"."user_permissions" add constraint "user_permissions_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."user_permissions" validate constraint "user_permissions_created_by_fkey";


