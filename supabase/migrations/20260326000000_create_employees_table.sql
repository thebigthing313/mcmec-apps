-- ============================================================================
-- Create employees table
-- Tracks all agency employees. user_id is NULL until they create an account.
-- ============================================================================

CREATE TABLE public.employees (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL,
  user_id uuid,
  display_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  CONSTRAINT employees_pkey PRIMARY KEY (id),
  CONSTRAINT employees_email_key UNIQUE (email),
  CONSTRAINT employees_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT employees_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT employees_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- RLS: authenticated users can read all employees
CREATE POLICY "select: all authenticated users"
  ON public.employees
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);

-- Grants (follow existing pattern from profiles/permissions tables)
GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER, TRUNCATE
  ON public.employees TO anon, authenticated, service_role;

-- ============================================================================
-- Trigger: sync employee_id to auth.users.raw_app_meta_data
-- Follows the same pattern as private.profile_id_to_metadata()
-- ============================================================================

CREATE OR REPLACE FUNCTION private.employee_id_to_metadata()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
AS $function$
DECLARE
  _user_id uuid;
  _employee_id uuid;
  _current_metadata jsonb;
BEGIN
  -- 1. DETERMINE OPERATION AND GET RELEVANT DATA

  IF TG_OP = 'DELETE' THEN
    _user_id := OLD.user_id;
    _employee_id := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle user_id changes: clear old user's metadata first
    IF OLD.user_id IS DISTINCT FROM NEW.user_id AND OLD.user_id IS NOT NULL THEN
      SELECT raw_app_meta_data INTO _current_metadata
      FROM auth.users WHERE id = OLD.user_id;

      IF _current_metadata IS NOT NULL THEN
        UPDATE auth.users
        SET raw_app_meta_data = _current_metadata - 'employee_id',
            updated_at = now()
        WHERE id = OLD.user_id;
      END IF;
    END IF;
    _user_id := NEW.user_id;
    _employee_id := NEW.id;
  ELSE
    -- INSERT
    _user_id := NEW.user_id;
    _employee_id := NEW.id;
  END IF;

  -- Skip if no user linked
  IF _user_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  -- 2. FETCH CURRENT METADATA

  SELECT raw_app_meta_data INTO _current_metadata
  FROM auth.users WHERE id = _user_id;

  IF _current_metadata IS NULL THEN
    _current_metadata := '{}'::jsonb;
  END IF;

  -- 3. UPDATE METADATA BASED ON OPERATION

  IF _employee_id IS NOT NULL AND (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    -- Set employee_id in metadata
    _current_metadata := jsonb_set(
      _current_metadata,
      '{employee_id}',
      to_jsonb(_employee_id::text),
      true
    );
  ELSE
    -- Remove employee_id from metadata (DELETE case)
    _current_metadata := _current_metadata - 'employee_id';
  END IF;

  -- 4. APPLY CHANGES

  UPDATE auth.users
  SET raw_app_meta_data = _current_metadata,
      updated_at = now()
  WHERE id = _user_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER employee_id_to_metadata_trigger
  AFTER INSERT OR DELETE OR UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION private.employee_id_to_metadata();
