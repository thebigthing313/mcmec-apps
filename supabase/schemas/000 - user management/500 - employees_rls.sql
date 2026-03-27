-- RLS policies for employees table
-- Placed after has_permission function (400) is defined

create policy "select: all authenticated users"
on public.employees
for select
to authenticated
using (true);

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
