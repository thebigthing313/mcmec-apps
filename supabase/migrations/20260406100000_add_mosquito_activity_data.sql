-- =============================================================================
-- Mosquito activity data (populated via CSV upload or Access DB push)
-- =============================================================================

create table public.mosquito_activity_data(
    id uuid primary key default gen_random_uuid(),
    species_name text not null,
    species_group text not null,
    year integer not null,
    week_number integer not null check (week_number between 1 and 53),
    mosquito_count integer not null default 0,
    rainfall_inches numeric(5,2) not null default 0,
    created_at timestamptz not null default now(),
    created_by uuid references auth.users(id) on delete set null,
    updated_at timestamptz not null default now(),
    updated_by uuid references auth.users(id) on delete set null
);

alter table public.mosquito_activity_data enable row level security;

create policy "select: allow all"
on public.mosquito_activity_data
for select
to public
using (true);

create policy "insert: public_notices permission"
on public.mosquito_activity_data
for insert
to authenticated
with check (
    has_permission('public_notices')
);

create policy "update: public_notices permission"
on public.mosquito_activity_data
for update
to authenticated
using (
    has_permission('public_notices')
)
with check (
    has_permission('public_notices')
);

create policy "delete: public_notices permission"
on public.mosquito_activity_data
for delete
to authenticated
using (
    has_permission('public_notices')
);

create trigger updated_mosquito_activity_data
    before update or insert
    on public.mosquito_activity_data
    for each row
    execute function public.set_audit_fields();
