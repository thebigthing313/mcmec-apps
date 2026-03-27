create or replace function private.employee_id_to_metadata()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
    _user_id uuid;
    _employee_id uuid;
    _current_metadata jsonb;
begin
    -- 1. DETERMINE OPERATION AND GET RELEVANT DATA

    if tg_op = 'DELETE' then
        _user_id := old.user_id;
        _employee_id := null;
    elsif tg_op = 'UPDATE' then
        -- Handle user_id changes: clear old user's metadata first
        if old.user_id is distinct from new.user_id and old.user_id is not null then
            select raw_app_meta_data into _current_metadata
            from auth.users where id = old.user_id;

            if _current_metadata is not null then
                update auth.users
                set raw_app_meta_data = _current_metadata - 'employee_id',
                    updated_at = now()
                where id = old.user_id;
            end if;
        end if;
        _user_id := new.user_id;
        _employee_id := new.id;
    else
        -- INSERT
        _user_id := new.user_id;
        _employee_id := new.id;
    end if;

    -- Skip if no user linked
    if _user_id is null then
        if tg_op = 'DELETE' then
            return old;
        end if;
        return new;
    end if;

    -- 2. FETCH CURRENT METADATA

    select raw_app_meta_data into _current_metadata
    from auth.users where id = _user_id;

    if _current_metadata is null then
        _current_metadata := '{}'::jsonb;
    end if;

    -- 3. UPDATE METADATA BASED ON OPERATION

    if _employee_id is not null and (tg_op = 'INSERT' or tg_op = 'UPDATE') then
        _current_metadata := jsonb_set(
            _current_metadata,
            '{employee_id}',
            to_jsonb(_employee_id::text),
            true
        );
    else
        _current_metadata := _current_metadata - 'employee_id';
    end if;

    -- 4. APPLY CHANGES

    update auth.users
    set raw_app_meta_data = _current_metadata,
        updated_at = now()
    where id = _user_id;

    if tg_op = 'DELETE' then
        return old;
    end if;
    return new;
end;
$$;

create trigger employee_id_to_metadata_trigger
after insert or update or delete on public.employees
for each row
execute function private.employee_id_to_metadata();
