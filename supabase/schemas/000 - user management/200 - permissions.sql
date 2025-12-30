create table public.permissions (
    id uuid primary key default gen_random_uuid(),
    permission_name text not null unique,
    permission_description text,
    created_at timestamp with time zone not null default now()
);

alter table public.permissions enable row level security;

create policy "select: all authenticated users"
on public.permissions
for select
to authenticated
using (true);