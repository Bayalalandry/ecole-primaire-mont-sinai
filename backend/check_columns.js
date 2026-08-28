const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkColumns() {
  console.log('=== Checking Students Table Columns ===');
  
  const possibleColumns = [
    'id', 'matricule', 'first_name', 'last_name', 
    'class_id', 'current_class_id', 'class',
    'school_year', 'current_school_year_id', 'school_year_id',
    'status', 'photo_url', 'parent_phone', 'parent_name',
    'date_of_birth', 'gender', 'parent_address'
  ];

  for (const col of possibleColumns) {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(col)
        .limit(1);
      
      if (error) {
        console.log(`❌ ${col}: ${error.message}`);
      } else {
        console.log(`✅ ${col}: exists`);
      }
    } catch (e) {
      console.log(`❌ ${col}: exception - ${e.message}`);
    }
  }
}

checkColumns().then(() => process.exit(0));