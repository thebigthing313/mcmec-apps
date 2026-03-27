create table public.user_permissions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    permission_name text not null references public.permissions(permission_name) on delete cascade,
    created_at timestamp with time zone not null default now(),
    created_by uuid references auth.users(id) on delete set null,
    updated_at timestamp with time zone not null default now(),
    updated_by uuid references auth.users(id) on delete set null
);

alter table public.user_permissions enable row level security;

create trigger updated_user_permissions
    before update or insert
    on public.user_permissions
    for each row
    execute function public.set_audit_fields();
