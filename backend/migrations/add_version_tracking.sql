-- Migration: Add version tracking fields to contracts table
-- This enables contract modification versioning with the pattern: contract-123-v2

-- Add version tracking columns
ALTER TABLE contracts
ADD COLUMN version INTEGER DEFAULT 1,
ADD COLUMN base_contract_id VARCHAR(255),
ADD COLUMN modification_date DATE,
ADD COLUMN previous_version_id UUID,
ADD COLUMN is_active BOOLEAN DEFAULT true,
ADD COLUMN modification_reason TEXT;

-- Create index on base_contract_id for faster version queries
CREATE INDEX idx_base_contract_id ON contracts(base_contract_id);

-- Create index on version for sorting
CREATE INDEX idx_version ON contracts(version);

-- Create index on is_active for filtering
CREATE INDEX idx_is_active ON contracts(is_active);

-- Add comment to explain versioning
COMMENT ON COLUMN contracts.version IS 'Version number of the contract (1 for original, 2+ for modifications)';
COMMENT ON COLUMN contracts.base_contract_id IS 'The original contract_id without version suffix (e.g., contract-123)';
COMMENT ON COLUMN contracts.modification_date IS 'Date when this modification takes effect';
COMMENT ON COLUMN contracts.previous_version_id IS 'UUID of the previous version of this contract';
COMMENT ON COLUMN contracts.is_active IS 'Whether this is the active/current version of the contract';
COMMENT ON COLUMN contracts.modification_reason IS 'Reason for creating this modification';
