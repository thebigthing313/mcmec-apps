create table public.notices (
    id uuid primary key default gen_random_uuid(),
    notice_type_id uuid not null references public.notice_types(id) on delete restrict,
    title text not null,
    notice_date date not null,
    content jsonb not null,
    publish_at timestamptz,
    created_at timestamptz not null default now(),
    created_by uuid references auth.users(id) on delete set null,
    updated_at timestamptz not null default now(),
    updated_by uuid references auth.users(id) on delete set null
);

alter table public.notices enable row level security;

create policy "select: allow all"
on public.notices
for select
to public
using (true);

create policy "insert: public_notices permission"
on public.notices
for insert
to authenticated
with check (
    has_permission('public_notices')
);

create policy "update: public_notices permission"
on public.notices
for update
to authenticated
using (
    has_permission('public_notices')
)
with check (
    has_permission('public_notices')
);

create policy "delete: public_notices permission"
on public.notices
for delete
to authenticated
using (
    has_permission('public_notices')
);

create trigger updated_notices
    before update or insert
    on public.notices
    for each row
    execute function public.set_audit_fields();