import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixModifiedTerms() {
  console.log('Fetching contracts with modifications...');

  const { data: contracts, error } = await supabase
    .from('lease_contracts')
    .select('*')
    .eq('data->>hasModification', 'true');

  if (error) {
    console.error('Error fetching contracts:', error);
    return;
  }

  console.log(`Found ${contracts.length} modified contracts`);

  for (const contract of contracts) {
    const data = contract.data;

    if (!data.originalTerms || !data.modifiedTerms) {
      console.log(`Skipping contract ${contract.contract_id} - missing terms`);
      continue;
    }

    const { originalTerms, modifiedTerms } = data;

    // Clean modifiedTerms - only keep fields that are different from original
    const cleanedModifiedTerms: any = {};

    for (const [key, value] of Object.entries(modifiedTerms)) {
      // Skip if value is undefined, null, or empty string
      if (value === undefined || value === null || value === '') {
        continue;
      }

      // Only include if different from original
      if (originalTerms[key] !== value) {
        cleanedModifiedTerms[key] = value;
      }
    }

    console.log(`\nContract: ${contract.contract_id}`);
    console.log('Original modifiedTerms keys:', Object.keys(modifiedTerms));
    console.log('Cleaned modifiedTerms keys:', Object.keys(cleanedModifiedTerms));

    // Update the contract
    const updatedData = {
      ...data,
      modifiedTerms: cleanedModifiedTerms
    };

    const { error: updateError } = await supabase
      .from('lease_contracts')
      .update({ data: updatedData })
      .eq('id', contract.id);

    if (updateError) {
      console.error(`Error updating contract ${contract.contract_id}:`, updateError);
    } else {
      console.log(`✅ Successfully cleaned contract ${contract.contract_id}`);
    }
  }

  console.log('\n✅ Done!');
}

fixModifiedTerms().catch(console.error);
