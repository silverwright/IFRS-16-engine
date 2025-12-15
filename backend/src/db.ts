import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch, { Headers, Request, Response } from 'node-fetch';

// Polyfill for Node.js 16
if (!globalThis.fetch) {
  globalThis.fetch = fetch as any;
  globalThis.Headers = Headers as any;
  globalThis.Request = Request as any;
  globalThis.Response = Response as any;
}

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey);

export const initDatabase = async () => {
  try {
    // Check if contracts table exists by trying to query it
    const { error } = await supabase.from('contracts').select('id').limit(1);

    if (error && error.message.includes('relation "contracts" does not exist')) {
      console.log('⚠️  Contracts table does not exist.');
      console.log('📋 Please create the table in Supabase using the SQL Editor:');
      console.log('');
      console.log('CREATE TABLE contracts (');
      console.log('  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),');
      console.log('  contract_id VARCHAR(255) NOT NULL UNIQUE,');
      console.log('  lessee_name VARCHAR(255) NOT NULL,');
      console.log('  asset_description TEXT NOT NULL,');
      console.log('  commencement_date DATE NOT NULL,');
      console.log('  mode VARCHAR(50) NOT NULL CHECK (mode IN (\'MINIMAL\', \'FULL\')),');
      console.log('  status VARCHAR(50) NOT NULL DEFAULT \'pending\' CHECK (status IN (\'pending\', \'approved\')),');
      console.log('  data JSONB NOT NULL,');
      console.log('  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,');
      console.log('  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
      console.log(');');
      console.log('');
      console.log('CREATE INDEX idx_contract_id ON contracts(contract_id);');
      console.log('CREATE INDEX idx_status ON contracts(status);');
      console.log('');
      throw new Error('Please create the contracts table in Supabase first.');
    }

    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

export default supabase;
