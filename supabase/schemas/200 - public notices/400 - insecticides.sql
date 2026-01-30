create table public.insecticides(
    id uuid primary key default gen_random_uuid(),
    type_name text not null,
    active_ingredient text not null,
    active_ingredient_url text not null,
    trade_name text not null,
    label_url text not null,
    msds_url text not null,
    created_at timestamptz not null default now(),
    created_by uuid references auth.users(id) on delete set null,
    updated_at timestamptz not null default now(),
    updated_by uuid references auth.users(id) on delete set null
);

alter table public.insecticides enable row level security;

create policy "select: allow all"
on public.insecticides
for select
to public
using (true);

create policy "insert: public_notices permission"
on public.insecticides
for insert
to authenticated
with check (
    has_permission('public_notices')
);

create policy "update: public_notices permission"
on public.insecticides
for update
to authenticated
using (
    has_permission('public_notices')
)
with check (
    has_permission('public_notices')
);

create policy "delete: public_notices permission"
on public.insecticides
for delete
to authenticated
using (
    has_permission('public_notices')
);

create trigger updated_insecticides
    before update or insert
    on public.insecticides
    for each row
    execute function public.set_audit_fields();

