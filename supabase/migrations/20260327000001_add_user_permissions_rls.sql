-- Add INSERT and DELETE RLS policies for user_permissions table
-- Requires admin_rights permission

create policy "insert: admin_rights permission"
on public.user_permissions
for insert
to authenticated
with check (has_permission('admin_rights'));

create policy "delete: admin_rights permission"
on public.user_permissions
for delete
to authenticated
using (has_permission('admin_rights'));
