import { supabase } from './src/db';

async function testTermination() {
  console.log('🧪 Testing termination functionality...\n');

  try {
    // 1. Get all contracts
    const { data: contracts, error: fetchError } = await supabase
      .from('contracts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (fetchError) throw fetchError;

    console.log(`📋 Found ${contracts?.length || 0} contracts\n`);

    if (!contracts || contracts.length === 0) {
      console.log('❌ No contracts found. Please create a contract first.');
      return;
    }

    // Display contracts with their key info
    contracts.forEach((contract, index) => {
      console.log(`${index + 1}. Contract ID: ${contract.contract_id}`);
      console.log(`   Lessee: ${contract.lessee_name}`);
      console.log(`   Commencement: ${contract.commencement_date}`);
      console.log(`   Version: ${contract.version || 1}`);
      console.log(`   Status: ${contract.status}`);

      // Check if it has termination data
      if (contract.data?.TerminatedEarly) {
        console.log(`   ✅ TERMINATED EARLY`);
        console.log(`   Termination Date: ${contract.data.TerminationDate}`);
        console.log(`   NonCancellableYears: ${contract.data.NonCancellableYears}`);
        console.log(`   Original NonCancellableYears: ${contract.data.NonCancellableYearsOriginal || 'N/A'}`);
        console.log(`   EndDate: ${contract.data.EndDate}`);
        console.log(`   Original EndDate: ${contract.data.EndDateOriginal || 'N/A'}`);
      } else {
        console.log(`   NonCancellableYears: ${contract.data?.NonCancellableYears || 'N/A'}`);
        console.log(`   EndDate: ${contract.data?.EndDate || 'N/A'}`);
      }
      console.log('');
    });

    console.log('\n✅ Test complete');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

testTermination();
