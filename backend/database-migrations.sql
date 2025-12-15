-- ================================================
-- IFRS 16 - Database Migration for Approval Workflow
-- ================================================

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('creator', 'approver', 'admin')),
  department VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Extend Contracts Table
ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS reviewer_id UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS approver_id UUID REFERENCES users(id),
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
  user_id UUID REFERENCES users(id),
  user_email VARCHAR(255),
  user_name VARCHAR(255),
  action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'submitted', 'reviewed', 'approved', 'rejected', 'revised')),
  from_status VARCHAR(50),
  to_status VARCHAR(50),
  comments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create Sessions Table (for JWT alternative or session management)
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT
);

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_created_by ON contracts(created_by);
CREATE INDEX IF NOT EXISTS idx_contracts_approver_id ON contracts(approver_id);
CREATE INDEX IF NOT EXISTS idx_approval_history_contract ON approval_history(contract_id);
CREATE INDEX IF NOT EXISTS idx_approval_history_user ON approval_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token_hash);

-- 7. Insert default admin user (password: Admin@123)
-- Note: You should change this password immediately after first login
INSERT INTO users (email, password_hash, first_name, last_name, role, department)
VALUES (
  'admin@ifrs16.com',
  '$2b$10$YourHashedPasswordHere', -- This will be replaced by actual bcrypt hash
  'System',
  'Administrator',
  'admin',
  'IT'
) ON CONFLICT (email) DO NOTHING;

-- 8. Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. Create triggers for updated_at
DROP TRIGGER IF EXISTS update_contracts_updated_at ON contracts;
CREATE TRIGGER update_contracts_updated_at
    BEFORE UPDATE ON contracts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 10. Grant necessary permissions (adjust as needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

-- ================================================
-- Sample Data for Testing (Optional)
-- ================================================

-- Insert sample users (passwords should be hashed in production)
-- Password for all test users: Test@123
/*
INSERT INTO users (email, password_hash, first_name, last_name, role, department) VALUES
  ('creator1@company.com', '$2b$10$YourHashedPasswordHere', 'John', 'Creator', 'creator', 'Finance'),
  ('creator2@company.com', '$2b$10$YourHashedPasswordHere', 'Jane', 'Smith', 'creator', 'Accounting'),
  ('approver1@company.com', '$2b$10$YourHashedPasswordHere', 'Mike', 'Approver', 'approver', 'Finance'),
  ('approver2@company.com', '$2b$10$YourHashedPasswordHere', 'Sarah', 'Johnson', 'approver', 'Management');
*/
