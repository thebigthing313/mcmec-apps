drop policy "select: allow all" on "public"."notices";


  create policy "select: allow all if authenticated, otherwise published only"
  on "public"."notices"
  as permissive
  for select
  to public
using ((((is_published = true) AND (notice_date <= CURRENT_DATE)) OR (( SELECT auth.role() AS role) = 'authenticated'::text)));



