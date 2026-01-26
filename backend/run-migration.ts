import { supabase } from './src/db';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
  try {
    console.log('\n🚀 Running version tracking migration...\n');

    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', 'add_version_tracking.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Remove comments and split by semicolon
    const statements = migrationSQL
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
      .join('\n')
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      console.log(stmt.substring(0, 100) + '...\n');

      const { error } = await supabase.rpc('exec_sql', { sql: stmt });

      if (error) {
        console.error(`❌ Error in statement ${i + 1}:`, error.message);
        // Continue anyway in case some statements already ran
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully\n`);
      }
    }

    console.log('\n🎉 Migration complete! Verifying...\n');

    // Verify the columns exist
    const { data, error } = await supabase
      .from('contracts')
      .select('version, base_contract_id, modification_date')
      .limit(1);

    if (error) {
      console.error('❌ Verification failed:', error.message);
      console.log('\n⚠️  Please run the migration manually via Supabase SQL Editor:');
      console.log('   1. Go to Supabase Dashboard > SQL Editor');
      console.log('   2. Copy the contents of backend/migrations/add_version_tracking.sql');
      console.log('   3. Paste and run the SQL\n');
    } else {
      console.log('✅ All version tracking columns exist!');
      console.log('   You can now use contract modification features.\n');
    }

  } catch (err: any) {
    console.error('❌ Error:', err.message);
    console.log('\n⚠️  Please run the migration manually via Supabase SQL Editor:');
    console.log('   1. Go to Supabase Dashboard > SQL Editor');
    console.log('   2. Copy the contents of backend/migrations/add_version_tracking.sql');
    console.log('   3. Paste and run the SQL\n');
  }
}

runMigration().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
