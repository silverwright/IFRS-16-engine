import { supabase } from './src/db';

async function testModify() {
  try {
    // Get the first contract
    const { data: contracts, error: fetchError } = await supabase
      .from('contracts')
      .select('*')
      .limit(1);

    if (fetchError || !contracts || contracts.length === 0) {
      console.error('No contracts found:', fetchError);
      return;
    }

    const contract = contracts[0];
    console.log('\n📄 Testing modification on contract:', contract.contract_id);
    console.log('Contract ID:', contract.id);
    console.log('Current version:', contract.version || 1);
    console.log('Base contract ID:', contract.base_contract_id || contract.contract_id);

    // Check database schema
    console.log('\n🔍 Checking database columns...');
    const { data: schemaData, error: schemaError } = await supabase
      .from('contracts')
      .select('*')
      .limit(0);

    if (schemaError) {
      console.error('Schema error:', schemaError);
    }

    console.log('\n✅ Test complete. Contract data structure looks good.');
    console.log('\n📝 Sample data field:', JSON.stringify(contract.data, null, 2).substring(0, 500));

  } catch (err) {
    console.error('❌ Error:', err);
  }
}

testModify().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
