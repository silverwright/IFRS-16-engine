import { supabase } from './src/db';

async function revertTerminatedContracts() {
  console.log('🔄 Reverting terminated contracts to preserve original calculations...\n');

  try {
    // Get all contracts
    const { data: contracts, error: fetchError } = await supabase
      .from('contracts')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) throw fetchError;

    // Find terminated contracts
    const terminatedContracts = contracts?.filter(c => c.data?.TerminatedEarly) || [];

    console.log(`Found ${terminatedContracts.length} terminated contracts to revert\n`);

    for (const contract of terminatedContracts) {
      console.log(`\nReverting: ${contract.contract_id}`);
      console.log(`Current NonCancellableYears: ${contract.data.NonCancellableYears}`);
      console.log(`Original NonCancellableYears: ${contract.data.NonCancellableYearsOriginal}`);

      // Restore original NonCancellableYears
      const originalNonCancellableYears = contract.data.NonCancellableYearsOriginal || contract.data.NonCancellableYears;

      // Update the contract - ONLY set termination metadata, don't change calculations
      const { error: updateError } = await supabase
        .from('contracts')
        .update({
          data: {
            ...contract.data,
            // Restore original NonCancellableYears for calculations
            NonCancellableYears: originalNonCancellableYears,
            // Keep termination metadata for display filtering
            TerminatedEarly: true,
            TerminationDate: contract.data.TerminationDate,
            EndDate: contract.data.TerminationDate,
          }
        })
        .eq('id', contract.id);

      if (updateError) {
        console.error(`  ❌ Error updating: ${updateError.message}`);
      } else {
        console.log(`  ✅ Reverted successfully!`);
        console.log(`  Restored NonCancellableYears: ${originalNonCancellableYears}`);
        console.log(`  Kept TerminationDate: ${contract.data.TerminationDate}`);
      }
    }

    console.log(`\n✅ All terminated contracts have been reverted!`);
    console.log(`\nCalculations will use original values, but tables will be filtered in the UI.`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

revertTerminatedContracts();
