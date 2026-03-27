-- RLS policies for user_permissions table
-- Placed after has_permission function (400) is defined

create policy "select: all authenticated users"
on public.user_permissions
for select
to authenticated
using (true);

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
