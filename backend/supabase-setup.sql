-- IFRS 16 Lease Engine - Supabase Database Setup
-- Run this SQL in your Supabase SQL Editor

-- Create contracts table
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id VARCHAR(255) NOT NULL UNIQUE,
  lessee_name VARCHAR(255) NOT NULL,
  asset_description TEXT NOT NULL,
  commencement_date DATE NOT NULL,
  mode VARCHAR(50) NOT NULL CHECK (mode IN ('MINIMAL', 'FULL')),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved')),
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_contract_id ON contracts(contract_id);
CREATE INDEX idx_status ON contracts(status);
CREATE INDEX idx_created_at ON contracts(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (you can customize this later for multi-user)
CREATE POLICY "Enable all operations for authenticated users" ON contracts
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Optional: Create a function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
