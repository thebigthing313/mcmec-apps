set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.set_audit_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
$function$
;

CREATE TRIGGER updated_notice_types BEFORE INSERT OR UPDATE ON public.notice_types FOR EACH ROW EXECUTE FUNCTION public.set_audit_fields();

CREATE TRIGGER updated_notices BEFORE INSERT OR UPDATE ON public.notices FOR EACH ROW EXECUTE FUNCTION public.set_audit_fields();

CREATE TRIGGER updated_user_permissions BEFORE INSERT ON public.user_permissions FOR EACH ROW EXECUTE FUNCTION public.set_audit_fields();

CREATE TRIGGER updated_user_profiles BEFORE INSERT OR UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.set_audit_fields();


