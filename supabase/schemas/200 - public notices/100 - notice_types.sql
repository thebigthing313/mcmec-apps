create table public.notice_types (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    description text,
    created_at timestamptz not null default now(),
    created_by uuid references auth.users(id) on delete set null,
    updated_at timestamptz not null default now(),
    updated_by uuid references auth.users(id) on delete set null
);

alter table public.notice_types enable row level security;

create policy "select: allow all"
on public.notice_types
for select
to public
using (true);

create policy "insert: public_notices permission"
on public.notice_types
for insert
to authenticated
with check (
    has_permission('public_notices')
);

create policy "update: public_notices permission"
on public.notice_types
for update
to authenticated
using (
    has_permission('public_notices')
)
with check (
    has_permission('public_notices')
);

create policy "delete: public_notices permission"
on public.notice_types
for delete
to authenticated
using (
    has_permission('public_notices')
);

create trigger updated_notice_types
    before update or insert
    on public.notice_types
    for each row
    execute function public.set_audit_fields();