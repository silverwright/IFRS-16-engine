import { supabase } from './src/db';

async function viewContracts() {
  try {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log('\n📋 CONTRACTS IN DATABASE\n');
    console.log(`Total Contracts: ${data.length}\n`);
    console.log('='.repeat(80));

    data.forEach((contract, index) => {
      console.log(`\n${index + 1}. Contract ID: ${contract.contract_id}`);
      console.log(`   Lessee: ${contract.lessee_name}`);
      console.log(`   Lessor: ${contract.lessor_name || 'N/A'}`);
      console.log(`   Asset: ${contract.asset_description}`);
      console.log(`   Status: ${contract.status}`);
      console.log(`   Mode: ${contract.mode}`);
      console.log(`   Commencement Date: ${contract.commencement_date}`);
      console.log(`   Created: ${new Date(contract.created_at).toLocaleString()}`);
      console.log(`   Database ID: ${contract.id}`);
      console.log(`   Created By: ${contract.created_by}`);
    });

    console.log('\n' + '='.repeat(80) + '\n');
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

viewContracts().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
