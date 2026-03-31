create table public.documents (
    id uuid primary key default gen_random_uuid(),
    document_type_id uuid not null references public.document_types(id) on delete restrict,
    fiscal_year integer not null,
    url text not null,
    is_published boolean not null default false,
    created_at timestamptz not null default now(),
    created_by uuid references auth.users(id) on delete set null,
    updated_at timestamptz not null default now(),
    updated_by uuid references auth.users(id) on delete set null
);

alter table public.documents enable row level security;

create policy "select: allow all if authenticated, otherwise published only"
on public.documents
for select
to public
using (
    (is_published = true)
    or
    ((select auth.role()) = 'authenticated')
);

create policy "insert: public_notices permission"
on public.documents
for insert
to authenticated
with check (
    has_permission('public_notices')
);

create policy "update: public_notices permission"
on public.documents
for update
to authenticated
using (
    has_permission('public_notices')
)
with check (
    has_permission('public_notices')
);

create policy "delete: public_notices permission"
on public.documents
for delete
to authenticated
using (
    has_permission('public_notices')
);

create trigger updated_documents
    before update or insert
    on public.documents
    for each row
    execute function public.set_audit_fields();
