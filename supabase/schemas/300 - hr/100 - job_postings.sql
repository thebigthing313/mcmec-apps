create table public.job_postings (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    content jsonb not null,
    published_at timestamptz,
    is_closed boolean not null default false,
    created_at timestamptz not null default now(),
    created_by uuid references auth.users(id) on delete set null,
    updated_at timestamptz not null default now(),
    updated_by uuid references auth.users(id) on delete set null
);

alter table public.job_postings enable row level security;

create policy "select: allow all if authenticated, otherwise published only"
on public.job_postings
for select
to public
using (
    (published_at is not null and published_at <= now() and is_closed = false)
    or
    ((select auth.role()) = 'authenticated' and has_permission('manage_employees'))
);

create policy "insert: manage_employees permission"
on public.job_postings
for insert
to authenticated
with check (
    has_permission('manage_employees')
);

create policy "update: manage_employees permission"
on public.job_postings
for update
to authenticated
using (
    has_permission('manage_employees')
)
with check (
    has_permission('manage_employees')
);

create policy "delete: manage_employees permission"
on public.job_postings
for delete
to authenticated
using (
    has_permission('manage_employees')
);

create trigger updated_job_postings
    before update or insert
    on public.job_postings
    for each row
    execute function public.set_audit_fields();
