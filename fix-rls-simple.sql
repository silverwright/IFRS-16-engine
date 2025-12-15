-- Temporarily disable RLS to test
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Verify it's disabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'user_profiles' AND schemaname = 'public';
