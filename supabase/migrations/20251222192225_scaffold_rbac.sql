create schema if not exists "private";

drop policy "select: all users" on "public"."permissions";

alter table "public"."permissions" add column "permission_description" text;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION private.user_permissions_to_metadata()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
    -- Variable to hold the UUID of the user to be updated
    target_user_id uuid;
    -- Variable to hold the aggregated list of permissions
    permission_list text[];
    -- Variable to hold the current raw_app_meta_data
    current_metadata jsonb;
begin
    -- 1. DETERMINE THE TARGET USER_ID
    -- We need the user_id that was affected by the CUD operation.
    if (tg_op = 'INSERT' or tg_op = 'UPDATE') then
        target_user_id := new.user_id;
    elsif (tg_op = 'DELETE') then
        target_user_id := old.user_id;
    else
        return null;
    end if;

    -- Exit if no user_id is found
    if target_user_id is null then
        return null;
    end if;

    -- 2. RE-AGGREGATE ALL CURRENT PERMISSIONS FOR THE USER
    -- Selects all distinct permission names linked to the user_id
    select array_agg(up.permission_name) into permission_list
    from public.user_permissions up
    where up.user_id = target_user_id;

    -- If permission_list is null (user has no permissions), initialize it to an empty array
    if permission_list is null then
        permission_list := '{}';
    end if;

    -- 3. FETCH CURRENT METADATA
    -- Get the current raw_app_meta_data for the user
    select raw_app_meta_data into current_metadata
    from auth.users
    where id = target_user_id;

    -- If the user doesn't exist or has no metadata, initialize to empty JSONB
    if not found or current_metadata is null then
        current_metadata := '{}'::jsonb;
    end if;

    -- 4. UPDATE METADATA WITH THE NEW PERMISSION LIST
    -- Convert the PostgreSQL TEXT array (permission_list) into a JSON array,
    -- then use jsonb_set to replace the entire "permissions" array in the metadata.
    current_metadata := jsonb_set(
        current_metadata,
        '{permissions}',
        to_jsonb(permission_list),
        true -- create_missing
    );

    -- 5. APPLY CHANGES TO auth.users
    update auth.users
    set
        raw_app_meta_data = current_metadata,
        updated_at = now()
    where id = target_user_id;

    -- The trigger function must return the NEW or OLD row
    if tg_op = 'DELETE' then
        return old;
    end if;

    return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.has_permission(p_permission_name text)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
$function$
;


  create policy "select: all authenticated users"
  on "public"."permissions"
  as permissive
  for select
  to authenticated
using (true);


CREATE TRIGGER user_permissions_to_metadata_trigger AFTER INSERT OR DELETE OR UPDATE ON public.user_permissions FOR EACH ROW EXECUTE FUNCTION private.user_permissions_to_metadata();


