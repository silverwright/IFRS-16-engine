-- Re-enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Service role has full access" ON user_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;

-- Create a simple policy that allows authenticated users to read all profiles
-- This is appropriate for a small team application where users need to see each other
CREATE POLICY "Authenticated users can read all profiles" ON user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'user_profiles';
