create schema private;
revoke all on schema private from public;
grant usage on schema private to service_role;