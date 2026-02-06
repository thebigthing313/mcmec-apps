create table public.contact_form_submissions(
    id uuid primary key default gen_random_uuid(),
    name text not null,
    email text not null,
    subject text not null,
    message text not null,
    is_closed boolean not null default false,
    created_at timestamptz not null default now(),
    created_by uuid references auth.users(id) on delete set null,
    updated_at timestamptz not null default now(),
    updated_by uuid references auth.users(id) on delete set null
);

alter table public.contact_form_submissions enable row level security;

create policy "select: requires public_notices permission"
on public.contact_form_submissions
for select
to authenticated
using (has_permission('public_notices'));

create policy "insert: requires public_notices permission"
on public.contact_form_submissions
for insert
to authenticated
with check (has_permission('public_notices'));

create policy "update: requires public_notices permission"
on public.contact_form_submissions
for update
to authenticated
using (has_permission('public_notices'))
with check (has_permission('public_notices'));

create policy "delete: requires public_notices permission"
on public.contact_form_submissions
for delete
to authenticated
using (has_permission('public_notices'));

create trigger updated_contact_form_submissions
    before update or insert
    on public.contact_form_submissions
    for each row
    execute function public.set_audit_fields();