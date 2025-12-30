create or replace function public.set_audit_fields () returns trigger language plpgsql
set
    search_path = '' security invoker as $$
declare
    user_id uuid;
begin

    user_id := auth.uid();

    if TG_OP = 'INSERT' then
        if user_id is not null then
            new.created_by = user_id;
        end if;
    end if;

    if TG_OP = 'UPDATE' OR TG_OP = 'INSERT' then
        new.updated_at = now();
        if user_id is not null then
            new.updated_by = user_id;
        end if;
    end if;

    return new;
end;
$$;