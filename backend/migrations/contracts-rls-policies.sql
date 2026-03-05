-- ============================================
-- Row-Level Security (RLS) Policies for Contracts Table
-- ============================================
-- This file implements role-based access control for the contracts table
--
-- Access Rules:
-- 1. Regular users (role: 'user') - Can only see and edit their own contracts
-- 2. Approvers (role: 'approver') - Can see all contracts, edit their own
-- 3. Admins (role: 'admin') - Full access to all contracts
-- ============================================

-- Enable RLS on contracts table
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read own contracts" ON contracts;
DROP POLICY IF EXISTS "Approvers can read all contracts" ON contracts;
DROP POLICY IF EXISTS "Admins can read all contracts" ON contracts;
DROP POLICY IF EXISTS "Users can insert own contracts" ON contracts;
DROP POLICY IF EXISTS "Users can update own contracts" ON contracts;
DROP POLICY IF EXISTS "Admins can update all contracts" ON contracts;
DROP POLICY IF EXISTS "Users can delete own contracts" ON contracts;
DROP POLICY IF EXISTS "Admins can delete all contracts" ON contracts;

-- ============================================
-- SELECT (READ) Policies
-- ============================================

-- Policy 1: Regular users can only read their own contracts
CREATE POLICY "Users can read own contracts" ON contracts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'user'
      AND contracts.created_by = auth.uid()
    )
  );

-- Policy 2: Approvers can read all contracts
CREATE POLICY "Approvers can read all contracts" ON contracts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'approver'
    )
  );

-- Policy 3: Admins can read all contracts
CREATE POLICY "Admins can read all contracts" ON contracts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- ============================================
-- INSERT Policies
-- ============================================

-- Policy 4: All authenticated users can create contracts
-- The created_by field will be automatically set to their user ID
CREATE POLICY "Users can insert own contracts" ON contracts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
  );

-- ============================================
-- UPDATE Policies
-- ============================================

-- Policy 5: Users and approvers can only update their own contracts
CREATE POLICY "Users can update own contracts" ON contracts
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('user', 'approver')
    )
  )
  WITH CHECK (
    created_by = auth.uid()
  );

-- Policy 6: Admins can update all contracts
CREATE POLICY "Admins can update all contracts" ON contracts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- ============================================
-- DELETE Policies
-- ============================================

-- Policy 7: Users can only delete their own draft contracts
CREATE POLICY "Users can delete own contracts" ON contracts
  FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
    AND status = 'draft'
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('user', 'approver')
    )
  );

-- Policy 8: Admins can delete any contract
CREATE POLICY "Admins can delete all contracts" ON contracts
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- ============================================
-- Verify Policies
-- ============================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'contracts'
ORDER BY policyname;

-- ============================================
-- Grant necessary permissions
-- ============================================
-- Ensure authenticated users can access the table
GRANT SELECT, INSERT, UPDATE, DELETE ON contracts TO authenticated;
GRANT SELECT ON user_profiles TO authenticated;

-- ============================================
-- Notes for Backend Implementation
-- ============================================
-- The backend should still implement additional filtering for performance
-- and to provide clear error messages. RLS acts as a security layer,
-- but the backend API should:
-- 1. Filter queries based on user role before sending to database
-- 2. Return appropriate HTTP status codes (403 Forbidden, etc.)
-- 3. Provide clear error messages for unauthorized access
-- 4. Log access attempts for audit purposes
