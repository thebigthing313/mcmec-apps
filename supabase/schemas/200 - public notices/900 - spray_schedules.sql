-- =============================================================================
-- Spray schedule status enum
-- =============================================================================

create type spray_schedule_status as enum ('scheduled', 'delayed', 'cancelled', 'completed');

-- =============================================================================
-- Municipalities lookup table (seeded, not admin-managed)
-- =============================================================================

create table public.municipalities(
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    created_at timestamptz not null default now(),
    created_by uuid references auth.users(id) on delete set null,
    updated_at timestamptz not null default now(),
    updated_by uuid references auth.users(id) on delete set null
);

alter table public.municipalities enable row level security;

create policy "select: allow all"
on public.municipalities
for select
to public
using (true);

create policy "insert: public_notices permission"
on public.municipalities
for insert
to authenticated
with check (
    has_permission('public_notices')
);

create policy "update: public_notices permission"
on public.municipalities
for update
to authenticated
using (
    has_permission('public_notices')
)
with check (
    has_permission('public_notices')
);

create policy "delete: public_notices permission"
on public.municipalities
for delete
to authenticated
using (
    has_permission('public_notices')
);

create trigger updated_municipalities
    before update or insert
    on public.municipalities
    for each row
    execute function public.set_audit_fields();

-- =============================================================================
-- Spray schedules table
-- =============================================================================

create table public.spray_schedules(
    id uuid primary key default gen_random_uuid(),
    mission_date date not null,
    start_time time not null,
    end_time time not null,
    rain_date date,
    area_description text not null,
    map_url text,
    status spray_schedule_status not null default 'scheduled',
    insecticide_id uuid not null references public.insecticides(id) on delete restrict,
    created_at timestamptz not null default now(),
    created_by uuid references auth.users(id) on delete set null,
    updated_at timestamptz not null default now(),
    updated_by uuid references auth.users(id) on delete set null
);

alter table public.spray_schedules enable row level security;

create policy "select: allow all"
on public.spray_schedules
for select
to public
using (true);

create policy "insert: public_notices permission"
on public.spray_schedules
for insert
to authenticated
with check (
    has_permission('public_notices')
);

create policy "update: public_notices permission"
on public.spray_schedules
for update
to authenticated
using (
    has_permission('public_notices')
)
with check (
    has_permission('public_notices')
);

create policy "delete: public_notices permission"
on public.spray_schedules
for delete
to authenticated
using (
    has_permission('public_notices')
);

create trigger updated_spray_schedules
    before update or insert
    on public.spray_schedules
    for each row
    execute function public.set_audit_fields();

-- =============================================================================
-- Spray schedule ↔ municipalities join table
-- =============================================================================

create table public.spray_schedule_municipalities(
    spray_schedule_id uuid not null references public.spray_schedules(id) on delete cascade,
    municipality_id uuid not null references public.municipalities(id) on delete restrict,
    primary key (spray_schedule_id, municipality_id)
);

alter table public.spray_schedule_municipalities enable row level security;

create policy "select: allow all"
on public.spray_schedule_municipalities
for select
to public
using (true);

create policy "insert: public_notices permission"
on public.spray_schedule_municipalities
for insert
to authenticated
with check (
    has_permission('public_notices')
);

create policy "update: public_notices permission"
on public.spray_schedule_municipalities
for update
to authenticated
using (
    has_permission('public_notices')
)
with check (
    has_permission('public_notices')
);

create policy "delete: public_notices permission"
on public.spray_schedule_municipalities
for delete
to authenticated
using (
    has_permission('public_notices')
);
