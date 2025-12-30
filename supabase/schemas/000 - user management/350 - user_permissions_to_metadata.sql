create or replace function private.user_permissions_to_metadata()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
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
$$;

create trigger user_permissions_to_metadata_trigger
after insert or update or delete on public.user_permissions
for each row
execute function private.user_permissions_to_metadata();