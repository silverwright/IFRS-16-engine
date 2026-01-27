import { supabase } from './src/db';

async function debugContractData() {
  console.log('🔍 Debugging contract data...\n');

  try {
    // Get LC-2024-007 versions
    const { data: contracts, error } = await supabase
      .from('contracts')
      .select('*')
      .like('contract_id', 'LC-2024-007%')
      .order('version', { ascending: true });

    if (error) throw error;

    console.log(`Found ${contracts?.length || 0} contracts\n`);

    contracts?.forEach(contract => {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`Contract: ${contract.contract_id} (v${contract.version})`);
      console.log(`ID: ${contract.id}`);
      console.log(`Base Contract ID: ${contract.base_contract_id || 'N/A'}`);
      console.log(`Is Active: ${contract.is_active}`);
      console.log(`\nData Fields:`);
      console.log(`  - TerminatedEarly: ${contract.data?.TerminatedEarly}`);
      console.log(`  - TerminationDate: ${contract.data?.TerminationDate}`);
      console.log(`  - EndDate: ${contract.data?.EndDate}`);
      console.log(`  - EndDateOriginal: ${contract.data?.EndDateOriginal}`);
      console.log(`  - NonCancellableYears: ${contract.data?.NonCancellableYears}`);
      console.log(`  - CommencementDate: ${contract.data?.CommencementDate}`);
    });

    console.log(`\n${'='.repeat(80)}\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

debugContractData();
