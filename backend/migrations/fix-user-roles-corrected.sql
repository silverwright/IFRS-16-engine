-- ================================================
-- CORRECTED: Complete User Setup Script
-- ================================================
-- Run this script in the correct order to avoid constraint violations
-- ================================================

-- STEP 1: Drop the old constraint FIRST (before updating data)
ALTER TABLE user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_role_check;

-- STEP 2: Now update existing 'creator' roles to 'user' (no constraint blocking)
UPDATE user_profiles
SET role = 'user'
WHERE role = 'creator';

-- STEP 3: Add new constraint with 'user' instead of 'creator'
ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_role_check
  CHECK (role IN ('user', 'approver', 'admin'));

-- STEP 4: Update the default value for new users
ALTER TABLE user_profiles
  ALTER COLUMN role SET DEFAULT 'user';

-- STEP 5: Update the auto-create user profile function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, first_name, last_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    COALESCE(new.raw_user_meta_data->>'role', 'user')
  );
  RETURN new;
END;
$$ language plpgsql security definer;

-- STEP 6: Set up your three users with correct roles
-- Update ifrsadmin@test.com to admin
UPDATE user_profiles
SET role = 'admin',
    first_name = 'IFRS',
    last_name = 'Admin'
WHERE email = 'ifrsadmin@test.com';

-- Update approver@test.com to approver
UPDATE user_profiles
SET role = 'approver',
    first_name = 'John',
    last_name = 'Approver'
WHERE email = 'approver@test.com';

-- Update creator@test.com to user (regular user role)
UPDATE user_profiles
SET role = 'user',
    first_name = 'Contract',
    last_name = 'Creator'
WHERE email = 'creator@test.com';

-- Update user@test.com to user if it exists
UPDATE user_profiles
SET role = 'user'
WHERE email = 'user@test.com';

-- STEP 7: Verify the results
SELECT
  email,
  role,
  first_name,
  last_name,
  is_active,
  created_at
FROM user_profiles
ORDER BY
  CASE role
    WHEN 'admin' THEN 1
    WHEN 'approver' THEN 2
    WHEN 'user' THEN 3
  END,
  email;
