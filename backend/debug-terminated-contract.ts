import { supabase } from './src/db';

async function debugTerminatedContract() {
  console.log('🔍 Debugging terminated contracts...\n');

  try {
    // Get all contracts
    const { data: contracts, error } = await supabase
      .from('contracts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log(`Found ${contracts?.length || 0} contracts\n`);

    // Find terminated contracts
    const terminatedContracts = contracts?.filter(c => c.data?.TerminatedEarly);

    if (terminatedContracts && terminatedContracts.length > 0) {
      console.log(`📋 TERMINATED CONTRACTS (${terminatedContracts.length}):\n`);

      terminatedContracts.forEach(contract => {
        console.log(`Contract ID: ${contract.contract_id}`);
        console.log(`Version: ${contract.version || 1}`);
        console.log(`Commencement: ${contract.commencement_date}`);
        console.log(`\nKey Fields in data:`);
        console.log(`  - TerminatedEarly: ${contract.data.TerminatedEarly}`);
        console.log(`  - TerminationDate: ${contract.data.TerminationDate}`);
        console.log(`  - NonCancellableYears: ${contract.data.NonCancellableYears}`);
        console.log(`  - NonCancellableYearsOriginal: ${contract.data.NonCancellableYearsOriginal}`);
        console.log(`  - EndDate: ${contract.data.EndDate}`);
        console.log(`  - EndDateOriginal: ${contract.data.EndDateOriginal}`);
        console.log(`  - RenewalOptionYears: ${contract.data.RenewalOptionYears}`);
        console.log(`  - TerminationOptionPoint: ${contract.data.TerminationOptionPoint}`);
        console.log(`  - TerminationOptionLikelihood: ${contract.data.TerminationOptionLikelihood}`);
        console.log(`\n${'='.repeat(60)}\n`);
      });
    } else {
      console.log('❌ No terminated contracts found.');
    }

    // Show all versions of contracts with modifications
    console.log(`\n📋 ALL CONTRACTS WITH VERSIONS:\n`);
    const contractsWithVersions = contracts?.filter(c => c.base_contract_id || c.version > 1);

    if (contractsWithVersions && contractsWithVersions.length > 0) {
      contractsWithVersions.forEach(contract => {
        console.log(`${contract.contract_id} (v${contract.version || 1})`);
        console.log(`  Base: ${contract.base_contract_id || 'N/A'}`);
        console.log(`  NonCancellableYears: ${contract.data.NonCancellableYears}`);
        console.log(`  TerminatedEarly: ${contract.data.TerminatedEarly || false}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

debugTerminatedContract();
