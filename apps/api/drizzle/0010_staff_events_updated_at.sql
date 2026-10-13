-- Custom SQL migration file, put your code below! --
-- See 0008_holidays_updated_at.sql: Railway runs only `db:migrate`, so a new table's
-- `set_updated_at` trigger ships here as well as in src/db/triggers.sql. The function is restated
-- so this runs on a database that has never had triggers.sql applied.
create or replace function set_updated_at() returns trigger
	language plpgsql as $$
begin
	new.updated_at = now();
	return new;
end $$;
--> statement-breakpoint
create or replace trigger set_updated_at before update on staff_events for each row execute function set_updated_at();
