create table if not exists public.user_profiles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete set null,
    display_name text not null,
    display_title text,
    avatar_url text,
    created_at timestamp with time zone default now(),
    created_by uuid references auth.users(id) on delete set null,
    updated_at timestamp with time zone default now(),
    updated_by uuid references auth.users(id) on delete set null
);

alter table public.user_profiles enable row level security;

create policy "select: all authenticated users"
on public.user_profiles
for select
to authenticated
using (true);

create trigger updated_user_profiles
    before update or insert
    on public.user_profiles
    for each row
    execute function public.set_audit_fields();