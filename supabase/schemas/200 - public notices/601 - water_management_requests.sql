create table public.water_management_requests (
    id uuid primary key default gen_random_uuid(),
    --- contact information
    full_name text not null,
    phone text not null,
    email text,
    address_line_1 text not null,
    address_line_2 text,
    zip_code_id uuid not null references public.zip_codes(id) on delete restrict,
    --- water management details
    location_of_concern text not null,
    is_on_my_property boolean not null default false,
    is_on_neighbor_property boolean not null default false,
    is_on_public_property boolean not null default false,
    other_location_description text,
    --- general
    is_processed boolean not null default false,
    additional_details text,
    created_at timestamptz not null default now(),
    created_by uuid references auth.users(id) on delete set null,
    updated_at timestamptz not null default now(),
    updated_by uuid references auth.users(id) on delete set null
);

alter table public.water_management_requests enable row level security;

create policy "select: requires public_notices permission"
on public.water_management_requests
for select
to authenticated
using (has_permission('public_notices'));

create policy "insert: requires public_notices permission"
on public.water_management_requests
for insert
to authenticated
with check (has_permission('public_notices'));

create policy "update: requires public_notices permission"
on public.water_management_requests
for update
to authenticated
using (has_permission('public_notices'))
with check (has_permission('public_notices'));

create policy "delete: requires public_notices permission"
on public.water_management_requests
for delete
to authenticated
using (has_permission('public_notices'));

create trigger updated_water_management_requests
    before update or insert
    on public.water_management_requests
    for each row
    execute function public.set_audit_fields();