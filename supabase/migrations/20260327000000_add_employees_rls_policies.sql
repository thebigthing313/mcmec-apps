-- Add INSERT, UPDATE, DELETE RLS policies for employees table
-- Requires manage_employees permission

create policy "insert: manage_employees permission"
on public.employees
for insert
to authenticated
with check (has_permission('manage_employees'));

create policy "update: manage_employees permission"
on public.employees
for update
to authenticated
using (has_permission('manage_employees'))
with check (has_permission('manage_employees'));

create policy "delete: manage_employees permission"
on public.employees
for delete
to authenticated
using (has_permission('manage_employees'));
