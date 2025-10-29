require('dotenv').config();
const { supabaseAdmin } = require('./src/config/supabase');

async function runMigration() {
  try {
    console.log('Running language preference migration...');
    
    // First, let's check if the column already exists
    const { data: columns, error: checkError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'user_profiles')
      .eq('column_name', 'language_preference');

    if (checkError) {
      console.error('Error checking column existence:', checkError);
      return;
    }

    if (columns && columns.length > 0) {
      console.log('✅ language_preference column already exists!');
      return;
    }

    console.log('Column does not exist, attempting to add it...');
    
    // Try to add a test record to see if we can access the table structure
    const { data: testData, error: testError } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .limit(1);

    if (testError) {
      console.error('Error accessing user_profiles table:', testError);
    } else {
      console.log('Successfully accessed user_profiles table');
      console.log('⚠️  Manual migration required: Please add language_preference column manually in Supabase dashboard');
      console.log('SQL: ALTER TABLE user_profiles ADD COLUMN language_preference VARCHAR(5) DEFAULT \'en\' CHECK (language_preference IN (\'en\', \'zh\', \'ms\', \'ta\'));');
    }
  } catch (err) {
    console.error('Error running migration:', err);
  }
}

runMigration();