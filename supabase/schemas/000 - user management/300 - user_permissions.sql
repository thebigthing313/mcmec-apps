create table public.user_permissions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    permission_name text not null references public.permissions(permission_name) on delete cascade,
    created_at timestamp with time zone not null default now(),
    created_by uuid references auth.users(id) default auth.uid()
);

alter table public.user_permissions enable row level security;

create policy "select: all authenticated users"
on public.user_permissions
for select
to authenticated
using (true);