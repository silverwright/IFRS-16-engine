-- ================================================
-- IFRS 16 - Simplified Database Migration Using Supabase Auth
-- ================================================

-- NOTE: Supabase provides auth.users table automatically
-- We only need to extend it with user_profiles

-- 1. Create user_profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) NOT NULL DEFAULT 'creator' CHECK (role IN ('creator', 'approver', 'admin')),
  department VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Extend Contracts Table with approval fields
ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS reviewer_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS approver_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS approver_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS approver_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS approval_notes TEXT;

-- 3. Update status constraint to include all 5 statuses
ALTER TABLE contracts
  DROP CONSTRAINT IF EXISTS contracts_status_check;

ALTER TABLE contracts
  ADD CONSTRAINT contracts_status_check
  CHECK (status IN ('draft', 'pending', 'under_review', 'approved', 'rejected'));

-- 4. Create Approval History Table (Audit Log)
CREATE TABLE IF NOT EXISTS approval_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  user_email VARCHAR(255),
  user_name VARCHAR(255),
  action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'submitted', 'reviewed', 'approved', 'rejected', 'revised')),
  from_status VARCHAR(50),
  to_status VARCHAR(50),
  comments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_created_by ON contracts(created_by);
CREATE INDEX IF NOT EXISTS idx_contracts_approver_id ON contracts(approver_id);
CREATE INDEX IF NOT EXISTS idx_approval_history_contract ON approval_history(contract_id);
CREATE INDEX IF NOT EXISTS idx_approval_history_user ON approval_history(user_id);

-- 6. Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Create triggers for updated_at
DROP TRIGGER IF EXISTS update_contracts_updated_at ON contracts;
CREATE TRIGGER update_contracts_updated_at
    BEFORE UPDATE ON contracts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Create function to auto-create user_profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, first_name, last_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    COALESCE(new.raw_user_meta_data->>'role', 'creator')
  );
  RETURN new;
END;
$$ language plpgsql security definer;

-- 9. Create trigger to auto-create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. Enable Row Level Security (RLS) for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- RLS Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policy: Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 11. Enable RLS for contracts
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read contracts they created or need to approve
CREATE POLICY "Users can read relevant contracts"
  ON contracts FOR SELECT
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('approver', 'admin')
    )
  );

-- RLS Policy: Creators can insert their own contracts
CREATE POLICY "Creators can insert contracts"
  ON contracts FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- RLS Policy: Users can update contracts they created (if draft)
CREATE POLICY "Creators can update draft contracts"
  ON contracts FOR UPDATE
  USING (auth.uid() = created_by AND status = 'draft');

-- RLS Policy: Approvers can update contracts under review
CREATE POLICY "Approvers can update pending contracts"
  ON contracts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('approver', 'admin')
    ) AND status IN ('pending', 'under_review')
  );

-- 12. Enable RLS for approval_history
ALTER TABLE approval_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read approval history for contracts they can see
CREATE POLICY "Users can read approval history"
  ON approval_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contracts
      WHERE id = approval_history.contract_id
      AND (
        created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE id = auth.uid() AND role IN ('approver', 'admin')
        )
      )
    )
  );

-- RLS Policy: System can insert approval history
CREATE POLICY "System can insert approval history"
  ON approval_history FOR INSERT
  WITH CHECK (true);

-- ================================================
-- IMPORTANT: After running this migration
-- ================================================
-- 1. Go to Supabase Dashboard > Authentication > Providers
-- 2. Enable Email provider (already enabled by default)
-- 3. Configure email templates if needed
-- 4. To create an admin user:
--    a. Sign up through the UI
--    b. Then run: UPDATE user_profiles SET role = 'admin' WHERE email = 'your@email.com';
-- ================================================
