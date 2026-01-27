import { supabase } from './src/db';

async function fixTerminatedContracts() {
  console.log('🔧 Fixing terminated contracts...\n');

  try {
    // Get all contracts
    const { data: contracts, error: fetchError } = await supabase
      .from('contracts')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) throw fetchError;

    // Find terminated contracts
    const terminatedContracts = contracts?.filter(c => c.data?.TerminatedEarly) || [];

    console.log(`Found ${terminatedContracts.length} terminated contracts to fix\n`);

    for (const contract of terminatedContracts) {
      console.log(`\nFixing: ${contract.contract_id}`);
      console.log(`Current NonCancellableYears: ${contract.data.NonCancellableYears}`);

      // Calculate the actual years from commencement to termination
      const commencementDate = new Date(contract.commencement_date);
      const terminationDate = new Date(contract.data.TerminationDate);
      const yearsUntilTermination = (terminationDate.getTime() - commencementDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

      console.log(`Calculated years until termination: ${yearsUntilTermination.toFixed(2)}`);

      // Get original end date
      const originalEndDate = contract.data.EndDateOriginal || contract.data.EndDate;
      const originalNonCancellableYears = contract.data.NonCancellableYearsOriginal || contract.data.NonCancellableYears;

      // Update the contract
      const { error: updateError } = await supabase
        .from('contracts')
        .update({
          data: {
            ...contract.data,
            EndDate: contract.data.TerminationDate, // Set EndDate to termination date
            EndDateOriginal: originalEndDate, // Preserve original end date
            NonCancellableYears: yearsUntilTermination, // Update to actual years until termination
            NonCancellableYearsOriginal: originalNonCancellableYears, // Preserve original term
            TerminatedEarly: true,
            TerminationDate: contract.data.TerminationDate,
            // Clear renewal and termination options
            RenewalOptionYears: 0,
            RenewalOptionLikelihood: 0,
            TerminationOptionPoint: '0',
            TerminationOptionLikelihood: 0,
          }
        })
        .eq('id', contract.id);

      if (updateError) {
        console.error(`  ❌ Error updating: ${updateError.message}`);
      } else {
        console.log(`  ✅ Fixed successfully!`);
        console.log(`  Updated NonCancellableYears: ${yearsUntilTermination.toFixed(2)}`);
        console.log(`  EndDate: ${contract.data.TerminationDate}`);
        console.log(`  Cleared renewal and termination options`);
      }
    }

    console.log(`\n✅ All terminated contracts have been fixed!`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

fixTerminatedContracts();
