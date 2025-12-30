create or replace function public.has_permission(p_permission_name text)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
    -- Get the current user's JWT claims as JSONB
    user_claims jsonb := current_setting('request.jwt.claims', true)::jsonb;
    has_permission boolean;
begin
    -- 1. Check if the permission name exists within the 'permissions' array
    --    inside the 'app_metadata' of the JWT claims.

    -- The structure we are checking:
    -- request.jwt.claims -> app_metadata -> permissions -> [ 'perm_a', 'perm_b' ]

    select coalesce((user_claims -> 'app_metadata' -> 'permissions')::jsonb @> to_jsonb(array[p_permission_name]), false)
    into has_permission;

    -- The operator @> checks if the left JSONB value contains the right JSONB value.
    -- Here, we check if the permissions array contains a single-element array
    -- created from the input permission name.
    -- coalesce is used to return false if the permissions array is missing.

    return has_permission;
end;
$$;