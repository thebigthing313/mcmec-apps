-- Custom SQL migration file, put your code below! --
-- `set_updated_at` is attached per table in src/db/triggers.sql, but nothing applies that file on
-- deploy: Railway runs only `db:migrate`, and only the test suite reads triggers.sql (after the
-- migrations). Without this the new table's `updated_at` would never move on staging or
-- production. The function is restated, identically to triggers.sql, so this migration also runs
-- on a database that has never had triggers.sql applied — the test database, for one.
create or replace function set_updated_at() returns trigger
	language plpgsql as $$
begin
	new.updated_at = now();
	return new;
end $$;
--> statement-breakpoint
create or replace trigger set_updated_at before update on holidays for each row execute function set_updated_at();
