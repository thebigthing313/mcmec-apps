-- Adult Mosquito Complaints
create table public.adult_mosquito_complaints (
    id uuid primary key default gen_random_uuid(),
    --- contact information
    full_name text not null,
    phone text not null,
    email text,
    address_line_1 text not null,
    address_line_2 text,
    zip_code_id uuid not null references public.zip_codes(id) on delete restrict,
    --- adult mosquito service details
    is_rear_of_property boolean not null default false,
    is_front_of_property boolean not null default false,
    is_general_vicinity boolean not null default false,
    is_dusk_dawn boolean not null default false,
    is_daytime boolean not null default false,
    is_nighttime boolean not null default false,
    is_accessible boolean not null default true,
    --- general
    is_processed boolean not null default false,
    additional_details text,
    created_at timestamptz not null default now(),
    created_by uuid references auth.users(id) on delete set null,
    updated_at timestamptz not null default now(),
    updated_by uuid references auth.users(id) on delete set null
);

alter table public.adult_mosquito_complaints enable row level security;

create policy "select: requires public_notices permission"
on public.adult_mosquito_complaints
for select
to authenticated
using (has_permission('public_notices'));

create policy "insert: requires authenticated user"
on public.adult_mosquito_complaints
for insert
to authenticated
with check (true);

create policy "update: requires public_notices permission"
on public.adult_mosquito_complaints
for update
to authenticated
using (has_permission('public_notices'))
with check (has_permission('public_notices'));

create policy "delete: requires public_notices permission"
on public.adult_mosquito_complaints
for delete
to authenticated
using (has_permission('public_notices'));

create trigger updated_adult_mosquito_complaints
    before update or insert
    on public.adult_mosquito_complaints
    for each row
    execute function public.set_audit_fields();



