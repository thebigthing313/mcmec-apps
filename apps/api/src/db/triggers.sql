-- Functions, triggers, and grants that Drizzle's DSL can't express.
-- Applied after `drizzle-kit push`/migrate (e.g. as a Drizzle custom migration or a psql step in
-- the Phase 1 deploy). Owned by the Postgres superuser; the app runs as the least-privilege role below.

-- ═══ 1. updated_at bump ═══════════════════════════════════════════════════════
create or replace function set_updated_at() returns trigger
	language plpgsql as $$
begin
	new.updated_at = now();
	return new;
end $$;

-- Attach to every carried table that has updated_at (NOT the Better-Auth tables — Better Auth
-- manages those timestamps — NOT audit_log / notice_postings / the join table).
create or replace trigger set_updated_at before update on employees              for each row execute function set_updated_at();
create or replace trigger set_updated_at before update on zip_codes              for each row execute function set_updated_at();
create or replace trigger set_updated_at before update on municipalities         for each row execute function set_updated_at();
create or replace trigger set_updated_at before update on notice_types           for each row execute function set_updated_at();
create or replace trigger set_updated_at before update on document_types         for each row execute function set_updated_at();
create or replace trigger set_updated_at before update on insecticides           for each row execute function set_updated_at();
create or replace trigger set_updated_at before update on notices                for each row execute function set_updated_at();
create or replace trigger set_updated_at before update on meetings               for each row execute function set_updated_at();
create or replace trigger set_updated_at before update on documents              for each row execute function set_updated_at();
create or replace trigger set_updated_at before update on spray_schedules        for each row execute function set_updated_at();
create or replace trigger set_updated_at before update on public_requests        for each row execute function set_updated_at();
create or replace trigger set_updated_at before update on job_postings           for each row execute function set_updated_at();
create or replace trigger set_updated_at before update on mosquito_activity_data for each row execute function set_updated_at();

-- ═══ 2. Audit log (append-only) ══════════════════════════════════════════════
-- SECURITY DEFINER so it can insert into audit_log even though the app role has no write there.
-- Actor comes from per-transaction GUCs the API sets via `SET LOCAL app.* = ...`.
--
-- `app.command` is the odd one out: the other four are request-scoped, but a single request can
-- carry several named commands, and each audit row must name the one that wrote it. So the
-- dispatcher re-sets it per command inside the transaction (setCommand in actor.ts) while the
-- actor GUCs are stamped once. Every current_setting here passes missing_ok => a write path that
-- sets nothing logs nulls rather than erroring, which is what keeps the pre-command paths working.
create or replace function log_mutation() returns trigger
	language plpgsql security definer set search_path = '' as $$
declare
	v_old jsonb := case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end;
	v_new jsonb := case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end;
begin
	insert into public.audit_log(
		table_name, record_id, operation, command,
		actor_user_id, actor_email, old_values, new_values, request_id, ip_address
	) values (
		tg_table_name,
		coalesce((v_new->>'id')::uuid, (v_old->>'id')::uuid),
		tg_op::public.audit_operation,
		nullif(current_setting('app.command', true), ''),
		nullif(current_setting('app.actor_user_id', true), '')::uuid,
		nullif(current_setting('app.actor_email', true), ''),
		v_old, v_new,
		nullif(current_setting('app.request_id', true), ''),
		nullif(current_setting('app.ip_address', true), '')
	);
	return coalesce(new, old);
end $$;

-- Coverage is opt-in. Start with personnel + access records; extend per table later.
create or replace trigger audit_employees after insert or update or delete on employees
	for each row execute function log_mutation();
-- users: role/ban/email changes. Writes made through the API (PUT /api/users/:id/roles) carry
-- the acting admin via the app.* GUCs; Better-Auth-initiated writes (signup, verification) have
-- no GUC set and are logged with a null actor (system event). No secrets live on this table
-- (credentials are on `accounts`), so to_jsonb(new) is safe to store.
create or replace trigger audit_users after insert or update or delete on users
	for each row execute function log_mutation();
-- (notices audit is optional/TBD — attach the same trigger here if you decide to.)

-- ═══ 3. Least-privilege app role + append-only hardening ══════════════════════
-- Apply in Phase 1 with a real password (or a Railway-referenced secret). The API's
-- DATABASE_URL uses this role instead of the postgres superuser.
--
--   create role app_rw login password :'app_pw';
--   grant connect on database railway to app_rw;
--   grant usage on schema public to app_rw;
--
--   -- full CRUD on data tables (Better Auth tables + all app tables)
--   grant select, insert, update, delete on all tables in schema public to app_rw;
--   grant usage, select on all sequences in schema public to app_rw;
--
--   -- append-only: no direct writes to the audit ledger; the SECURITY DEFINER trigger does inserts
--   revoke insert, update, delete on audit_log from app_rw;   -- SELECT stays (history views)
--
--   -- proof-of-posting: insert + read, but never mutate/delete
--   revoke update, delete on notice_postings from app_rw;
--
--   -- default privileges for future tables
--   alter default privileges in schema public grant select, insert, update, delete on tables to app_rw;

-- ═══ 4. Retention (7 years) ══════════════════════════════════════════════════
-- Run daily by a cron on the API service under a maintenance role (NOT app_rw, which can't delete):
--   delete from audit_log where occurred_at < now() - interval '7 years';
-- notice_postings is retained indefinitely (legal record) — never purged here.
