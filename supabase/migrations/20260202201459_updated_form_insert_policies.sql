drop policy "insert: requires authenticated user" on "public"."adult_mosquito_complaints";

drop policy "insert: requires authenticated user" on "public"."contact_form_submissions";

drop policy "insert: requires authenticated user" on "public"."mosquito_fish_requests";

drop policy "insert: requires authenticated user" on "public"."water_management_requests";


  create policy "insert: requires public_notices permission"
  on "public"."adult_mosquito_complaints"
  as permissive
  for insert
  to authenticated
with check (public.has_permission('public_notices'::text));



  create policy "insert: requires public_notices permission"
  on "public"."contact_form_submissions"
  as permissive
  for insert
  to authenticated
with check (public.has_permission('public_notices'::text));



  create policy "insert: requires public_notices permission"
  on "public"."mosquito_fish_requests"
  as permissive
  for insert
  to authenticated
with check (public.has_permission('public_notices'::text));



  create policy "insert: requires public_notices permission"
  on "public"."water_management_requests"
  as permissive
  for insert
  to authenticated
with check (public.has_permission('public_notices'::text));



