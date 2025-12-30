
  create table "public"."permissions" (
    "id" uuid not null default gen_random_uuid(),
    "permission_name" text not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."permissions" enable row level security;

CREATE UNIQUE INDEX permissions_permission_name_key ON public.permissions USING btree (permission_name);

CREATE UNIQUE INDEX permissions_pkey ON public.permissions USING btree (id);

alter table "public"."permissions" add constraint "permissions_pkey" PRIMARY KEY using index "permissions_pkey";

alter table "public"."permissions" add constraint "permissions_permission_name_key" UNIQUE using index "permissions_permission_name_key";

grant delete on table "public"."permissions" to "anon";

grant insert on table "public"."permissions" to "anon";

grant references on table "public"."permissions" to "anon";

grant select on table "public"."permissions" to "anon";

grant trigger on table "public"."permissions" to "anon";

grant truncate on table "public"."permissions" to "anon";

grant update on table "public"."permissions" to "anon";

grant delete on table "public"."permissions" to "authenticated";

grant insert on table "public"."permissions" to "authenticated";

grant references on table "public"."permissions" to "authenticated";

grant select on table "public"."permissions" to "authenticated";

grant trigger on table "public"."permissions" to "authenticated";

grant truncate on table "public"."permissions" to "authenticated";

grant update on table "public"."permissions" to "authenticated";

grant delete on table "public"."permissions" to "service_role";

grant insert on table "public"."permissions" to "service_role";

grant references on table "public"."permissions" to "service_role";

grant select on table "public"."permissions" to "service_role";

grant trigger on table "public"."permissions" to "service_role";

grant truncate on table "public"."permissions" to "service_role";

grant update on table "public"."permissions" to "service_role";


  create policy "select: all users"
  on "public"."permissions"
  as permissive
  for select
  to authenticated
using (true);



