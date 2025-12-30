alter table "public"."user_profiles" drop column "first_name";

alter table "public"."user_profiles" drop column "last_name";

alter table "public"."user_profiles" drop column "middle_name";

alter table "public"."user_profiles" add column "created_by" uuid;

alter table "public"."user_profiles" add column "display_name" text not null;

alter table "public"."user_profiles" add column "updated_by" uuid;

alter table "public"."user_profiles" alter column "user_id" set not null;

alter table "public"."user_profiles" add constraint "user_profiles_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."user_profiles" validate constraint "user_profiles_created_by_fkey";

alter table "public"."user_profiles" add constraint "user_profiles_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."user_profiles" validate constraint "user_profiles_updated_by_fkey";


