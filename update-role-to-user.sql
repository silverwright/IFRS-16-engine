-- ================================================
-- Update Role Name from 'creator' to 'user'
-- ================================================
-- This migration updates the user_profiles table to use 'user' instead of 'creator'
-- to maintain consistency with the backend code and RBAC documentation

-- 1. Update existing 'creator' roles to 'user'
UPDATE user_profiles
SET role = 'user'
WHERE role = 'creator';

-- 2. Drop the old constraint
ALTER TABLE user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_role_check;

-- 3. Add new constraint with 'user' instead of 'creator'
ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_role_check
  CHECK (role IN ('user', 'approver', 'admin'));

-- 4. Update the default value for new users
ALTER TABLE user_profiles
  ALTER COLUMN role SET DEFAULT 'user';

-- 5. Update the auto-create user profile function to use 'user' as default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, first_name, last_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    COALESCE(new.raw_user_meta_data->>'role', 'user')  -- Changed from 'creator' to 'user'
  );
  RETURN new;
END;
$$ language plpgsql security definer;

-- 6. Verify the changes
SELECT
  role,
  COUNT(*) as count
FROM user_profiles
GROUP BY role
ORDER BY role;

-- ================================================
-- Expected output after running this migration:
-- role     | count
-- ---------+-------
-- admin    | X
-- approver | X
-- user     | X
-- ================================================
