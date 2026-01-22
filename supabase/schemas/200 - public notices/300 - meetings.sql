create table public.meetings(
    id uuid primary key default gen_random_uuid(),
    name text not null,
    location text not null,
    meeting_at timestamptz not null,
    is_cancelled boolean not null default false,
    agenda_url text,
    minutes_url text,
    report_url text,
    notice_url text,
    notes text,
    created_at timestamptz not null default now(),
    created_by uuid references auth.users(id) on delete set null,
    updated_at timestamptz not null default now(),
    updated_by uuid references auth.users(id) on delete set null
);

alter table public.meetings enable row level security;

create policy "select: allow all"
on public.meetings
for select
to public
using (true);

create policy "insert: public_notices permission"
on public.meetings
for insert
to authenticated
with check (
    has_permission('public_notices')
);

create policy "update: public_notices permission"
on public.meetings
for update
to authenticated
using (
    has_permission('public_notices')
)
with check (
    has_permission('public_notices')
);

create policy "delete: public_notices permission"
on public.meetings
for delete
to authenticated
using (
    has_permission('public_notices')
);

create trigger updated_meetings
    before update or insert
    on public.meetings
    for each row
    execute function public.set_audit_fields();