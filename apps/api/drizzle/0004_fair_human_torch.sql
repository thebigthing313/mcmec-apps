ALTER TABLE "audit_log" ADD COLUMN "command" text;--> statement-breakpoint
-- Custom step, hand-added: replaces log_mutation() so the new column is populated from the
-- app.command GUC. Kept in sync with src/db/triggers.sql, which is the source of truth for
-- the function — but triggers.sql has no automated apply path, and this column is useless
-- until the trigger writes it, so the replacement rides the migration that adds the column.
CREATE OR REPLACE FUNCTION log_mutation() RETURNS trigger
	LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
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
