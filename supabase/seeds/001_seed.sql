-- =============================================================================
-- Seed data for local development
-- Run with: supabase db reset (applies migrations then seeds)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Test user (Supabase local auth)
--    Email: admin@test.local / Password: password123
-- ---------------------------------------------------------------------------
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, confirmation_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'authenticated', 'authenticated',
  'admin@test.local',
  crypt('password123', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  ''
);

INSERT INTO auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  jsonb_build_object('sub', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'email', 'admin@test.local'),
  'email',
  now(), now(), now()
);

-- ---------------------------------------------------------------------------
-- 2. User profile
-- ---------------------------------------------------------------------------
INSERT INTO public.user_profiles (user_id, first_name, last_name, display_title)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Test', 'Admin', 'Administrator');

-- ---------------------------------------------------------------------------
-- 3. Permissions
-- ---------------------------------------------------------------------------
INSERT INTO public.permissions (permission_name, permission_description)
VALUES ('public_notices', 'Manage public notices, meetings, insecticides, and service requests');

-- ---------------------------------------------------------------------------
-- 4. Grant the test user all permissions
-- ---------------------------------------------------------------------------
INSERT INTO public.user_permissions (user_id, permission_name)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'public_notices');

-- ---------------------------------------------------------------------------
-- 5. Employees
-- ---------------------------------------------------------------------------

-- 5.1 Linked employee (has an account)
INSERT INTO public.employees (email, user_id, display_name)
VALUES ('admin@test.local', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Test Admin');

-- 5.2 Unlinked employee (no account yet — for testing create-account flow)
INSERT INTO public.employees (email, display_name)
VALUES ('unlinked@test.local', 'Unlinked Employee');

-- ---------------------------------------------------------------------------
-- 6. Notice types
-- ---------------------------------------------------------------------------
INSERT INTO public.notice_types (name, description) VALUES
  ('General', 'General public notices'),
  ('Spraying', 'Mosquito spraying schedule notices'),
  ('Meeting', 'Commission meeting notices'),
  ('Advisory', 'Public health advisories');

-- ---------------------------------------------------------------------------
-- 7. Sample notices
-- ---------------------------------------------------------------------------
INSERT INTO public.notices (notice_type_id, title, content, notice_date, is_published, is_archived)
VALUES
  (
    (SELECT id FROM public.notice_types WHERE name = 'Spraying'),
    'Aerial Spraying Scheduled — North District',
    '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Aerial spraying for adult mosquitoes will take place in the North District on the evening of March 28. Residents are advised to stay indoors during application."}]}]}'::jsonb,
    '2026-03-28',
    true,
    false
  ),
  (
    (SELECT id FROM public.notice_types WHERE name = 'General'),
    'Seasonal Reminder: Eliminate Standing Water',
    '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"As warmer weather approaches, please remove any standing water sources around your property to help reduce mosquito breeding."}]}]}'::jsonb,
    '2026-03-15',
    true,
    false
  ),
  (
    (SELECT id FROM public.notice_types WHERE name = 'Advisory'),
    'West Nile Virus Activity Detected',
    '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"West Nile Virus has been detected in mosquito samples collected from the South District. Take precautions to avoid mosquito bites."}]}]}'::jsonb,
    '2026-04-01',
    false,
    false
  );

-- ---------------------------------------------------------------------------
-- 8. Sample meetings
-- ---------------------------------------------------------------------------
INSERT INTO public.meetings (name, meeting_at, location, is_cancelled) VALUES
  ('Regular Commission Meeting', '2026-04-09 19:00:00+00', '1 JFK Blvd, New Brunswick, NJ', false),
  ('Regular Commission Meeting', '2026-05-14 19:00:00+00', '1 JFK Blvd, New Brunswick, NJ', false),
  ('Special Budget Meeting',     '2026-04-23 18:00:00+00', '1 JFK Blvd, New Brunswick, NJ', false);

-- ---------------------------------------------------------------------------
-- 9. Sample insecticides
-- ---------------------------------------------------------------------------
INSERT INTO public.insecticides (type_name, active_ingredient, active_ingredient_url, trade_name, label_url, msds_url) VALUES
  ('Larvicide', 'Bacillus thuringiensis israelensis (Bti)', 'https://example.com/bti', 'VectoBac 12AS', 'https://example.com/vectobac-label', 'https://example.com/vectobac-msds'),
  ('Adulticide', 'Sumithrin + PBO', 'https://example.com/sumithrin', 'Anvil 10+10 ULV', 'https://example.com/anvil-label', 'https://example.com/anvil-msds'),
  ('Larvicide', 'Methoprene', 'https://example.com/methoprene', 'Altosid Pellets', 'https://example.com/altosid-label', 'https://example.com/altosid-msds');

-- ---------------------------------------------------------------------------
-- 10. Zip codes (Middlesex County, NJ)
-- ---------------------------------------------------------------------------
INSERT INTO public.zip_codes (code, city, state) VALUES
  ('08901', 'New Brunswick', 'NJ'),
  ('08902', 'North Brunswick', 'NJ'),
  ('08903', 'New Brunswick', 'NJ'),
  ('08816', 'East Brunswick', 'NJ'),
  ('08817', 'Edison', 'NJ'),
  ('08820', 'Edison', 'NJ'),
  ('08837', 'Edison', 'NJ'),
  ('08840', 'Metuchen', 'NJ'),
  ('08846', 'Middlesex', 'NJ'),
  ('08854', 'Piscataway', 'NJ'),
  ('08855', 'Piscataway', 'NJ'),
  ('08857', 'Old Bridge', 'NJ'),
  ('08859', 'Parlin', 'NJ'),
  ('08861', 'Perth Amboy', 'NJ'),
  ('08862', 'Perth Amboy', 'NJ'),
  ('08863', 'Fords', 'NJ'),
  ('08871', 'Sayreville', 'NJ'),
  ('08872', 'Sayreville', 'NJ'),
  ('08879', 'South Amboy', 'NJ'),
  ('08882', 'South River', 'NJ'),
  ('08884', 'Spotswood', 'NJ'),
  ('08899', 'Edison', 'NJ'),
  ('07001', 'Avenel', 'NJ'),
  ('07064', 'Port Reading', 'NJ'),
  ('07067', 'Colonia', 'NJ'),
  ('07077', 'Sewaren', 'NJ'),
  ('07080', 'South Plainfield', 'NJ'),
  ('07095', 'Woodbridge', 'NJ'),
  ('08810', 'Dayton', 'NJ'),
  ('08812', 'Dunellen', 'NJ'),
  ('08824', 'Kendall Park', 'NJ'),
  ('08828', 'Helmetta', 'NJ'),
  ('08830', 'Iselin', 'NJ'),
  ('08831', 'Monroe Township', 'NJ'),
  ('08832', 'Jamesburg', 'NJ'),
  ('08850', 'Milltown', 'NJ'),
  ('08852', 'Monmouth Junction', 'NJ'),
  ('07008', 'Carteret', 'NJ'),
  ('08536', 'Plainsboro', 'NJ'),
  ('08540', 'Princeton', 'NJ');

-- ---------------------------------------------------------------------------
-- 11. Sample service requests (contact form, complaint, fish request)
-- ---------------------------------------------------------------------------
INSERT INTO public.contact_form_submissions (name, email, subject, message)
VALUES ('Jane Doe', 'jane@example.com', 'Question about spraying schedule', 'When will spraying occur in the 08901 area?');

INSERT INTO public.adult_mosquito_complaints (
  full_name, phone, email, address_line_1, zip_code_id,
  is_rear_of_property, is_dusk_dawn
) VALUES (
  'John Smith', '732-555-0100', 'john@example.com', '123 Main St',
  (SELECT id FROM public.zip_codes WHERE code = '08901'),
  true, true
);

INSERT INTO public.mosquito_fish_requests (
  full_name, phone, email, address_line_1, zip_code_id,
  location_of_water_body, type_of_water_body
) VALUES (
  'Maria Garcia', '732-555-0200', 'maria@example.com', '456 Oak Ave',
  (SELECT id FROM public.zip_codes WHERE code = '08816'),
  'Backyard pond near fence line', 'Pond'
);

INSERT INTO public.water_management_requests (
  full_name, phone, email, address_line_1, zip_code_id,
  location_of_concern, is_on_public_property
) VALUES (
  'Bob Johnson', '732-555-0300', 'bob@example.com', '789 Elm St',
  (SELECT id FROM public.zip_codes WHERE code = '08854'),
  'Drainage ditch along Cedar Lane', true
);
