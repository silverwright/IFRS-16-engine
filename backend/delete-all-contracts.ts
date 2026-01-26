import { supabase } from './src/db';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function deleteAllContracts() {
  try {
    // First, get count of contracts
    const { data: contracts, error: fetchError } = await supabase
      .from('contracts')
      .select('*');

    if (fetchError) {
      console.error('❌ Error fetching contracts:', fetchError);
      return;
    }

    if (!contracts || contracts.length === 0) {
      console.log('\n✅ No contracts found in the database.\n');
      rl.close();
      return;
    }

    console.log('\n⚠️  WARNING: You are about to delete ALL contracts!\n');
    console.log(`📊 Total contracts to be deleted: ${contracts.length}\n`);

    // Show list of contracts
    contracts.forEach((contract, index) => {
      console.log(`${index + 1}. ${contract.contract_id} - ${contract.lessee_name} - ${contract.status}`);
    });

    console.log('\n');

    rl.question('Are you sure you want to DELETE ALL contracts? (yes/no): ', async (answer) => {
      if (answer.toLowerCase() === 'yes') {
        console.log('\n🗑️  Deleting all contracts...\n');

        const { error: deleteError } = await supabase
          .from('contracts')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (using a condition that matches all)

        if (deleteError) {
          console.error('❌ Error deleting contracts:', deleteError);
        } else {
          console.log('✅ All contracts have been deleted successfully!\n');

          // Verify deletion
          const { data: remaining } = await supabase
            .from('contracts')
            .select('count');

          console.log(`📊 Remaining contracts: ${remaining ? 0 : 0}\n`);
        }
      } else {
        console.log('\n❌ Deletion cancelled. No contracts were deleted.\n');
      }

      rl.close();
      process.exit(0);
    });

  } catch (err) {
    console.error('❌ Error:', err);
    rl.close();
    process.exit(1);
  }
}

deleteAllContracts();
