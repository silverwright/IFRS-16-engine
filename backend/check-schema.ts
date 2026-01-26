import { supabase } from './src/db';

async function checkSchema() {
  try {
    console.log('\n🔍 Checking contracts table schema...\n');

    // Try to select with version tracking fields
    const { data, error } = await supabase
      .from('contracts')
      .select('version, base_contract_id, modification_date, previous_version_id, is_active, modification_reason')
      .limit(1);

    if (error) {
      console.error('❌ Error - Version tracking columns may not exist:', error.message);
      console.log('\n📝 You need to run the migration:');
      console.log('   Run the SQL in backend/migrations/add_version_tracking.sql on your Supabase database\n');
      return;
    }

    console.log('✅ Version tracking columns exist!');
    console.log('Sample data:', data);

  } catch (err: any) {
    console.error('❌ Error:', err.message);
  }
}

checkSchema().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
