create table if not exists public.employees (
    id uuid primary key default gen_random_uuid(),
    email text not null unique,
    user_id uuid references auth.users(id) on delete set null,
    display_name text not null,
    display_title text,
    created_at timestamptz not null default now(),
    created_by uuid references auth.users(id) on delete set null,
    updated_at timestamptz not null default now(),
    updated_by uuid references auth.users(id) on delete set null
);

alter table public.employees enable row level security;

create policy "select: all authenticated users"
on public.employees
for select
to authenticated
using (true);

create trigger updated_employees
    before update or insert
    on public.employees
    for each row
    execute function public.set_audit_fields();
