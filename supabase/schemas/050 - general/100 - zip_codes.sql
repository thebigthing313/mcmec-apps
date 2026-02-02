create table public.zip_codes(
    id uuid primary key default gen_random_uuid(),
    code text not null unique,
    city text not null,
    state text not null,
    created_at timestamptz not null default now(),
    created_by uuid references auth.users(id) on delete set null,
    updated_at timestamptz not null default now(),
    updated_by uuid references auth.users(id) on delete set null
);

alter table public.zip_codes enable row level security;

create policy "select: all"
on public.zip_codes
for select
to public
using (true);

create trigger updated_zip_codes
    before update or insert
    on public.zip_codes
    for each row
    execute function public.set_audit_fields();
