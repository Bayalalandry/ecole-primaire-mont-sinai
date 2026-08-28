const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkTeachersTable() {
  console.log('=== Verification table teachers ===\n');
  
  try {
    const { data, error } = await supabase
      .from('teachers')
      .select('*');
    
    if (error) {
      console.log('Erreur:', error.message);
      return;
    }
    
    console.log(`${data.length} enregistrement(s) dans teachers:`);
    data.forEach((t, i) => {
      console.log(`  ${i + 1}. user_id: ${t.user_id}, status: ${t.status}`);
    });
    
  } catch (error) {
    console.log('Erreur:', error.message);
  }
}

checkTeachersTable().then(() => process.exit(0));