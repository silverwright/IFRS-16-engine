import { supabase } from './src/db';

async function fixNewVersionTermination() {
  console.log('🔧 Fixing termination flags on new versions (v2+)...\n');

  try {
    // Get all contracts with version >= 2
    const { data: contracts, error: fetchError } = await supabase
      .from('contracts')
      .select('*')
      .gte('version', 2)
      .order('created_at', { ascending: false });

    if (fetchError) throw fetchError;

    console.log(`Found ${contracts?.length || 0} version 2+ contracts\n`);

    if (!contracts || contracts.length === 0) {
      console.log('❌ No version 2+ contracts found.');
      return;
    }

    for (const contract of contracts) {
      // Check if this contract has termination flags
      if (contract.data?.TerminatedEarly) {
        console.log(`\nFixing: ${contract.contract_id} (v${contract.version})`);
        console.log(`  Current TerminatedEarly: ${contract.data.TerminatedEarly}`);
        console.log(`  Current TerminationDate: ${contract.data.TerminationDate}`);

        // Remove termination flags from new version
        const { error: updateError } = await supabase
          .from('contracts')
          .update({
            data: {
              ...contract.data,
              // Remove termination flags - this is a new lease
              TerminatedEarly: false,
              TerminationDate: undefined,
              EndDateOriginal: undefined,
            }
          })
          .eq('id', contract.id);

        if (updateError) {
          console.error(`  ❌ Error updating: ${updateError.message}`);
        } else {
          console.log(`  ✅ Fixed! Removed termination flags from new version`);
        }
      } else {
        console.log(`\n${contract.contract_id} (v${contract.version}) - Already clean ✓`);
      }
    }

    console.log(`\n✅ All new versions have been cleaned!`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

fixNewVersionTermination();
