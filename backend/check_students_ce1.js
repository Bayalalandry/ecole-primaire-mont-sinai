const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkStudentsCE1() {
  console.log('=== Check Students in CE1 ===\n');
  
  try {
    const ce1Id = 'ca3de727-88a1-484a-ad15-9593781c4a4b';
    
    const { data: students, error } = await supabase
      .from('students')
      .select('*')
      .eq('current_class_id', ce1Id);
    
    if (error) {
      console.log('Erreur:', error.message);
      return;
    }
    
    console.log(`Students in CE1: ${students.length}`);
    students.forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.first_name} ${s.last_name} (${s.matricule}) - Created by: ${s.created_by}`);
    });
    
  } catch (error) {
    console.log('Erreur:', error.message);
  }
}

checkStudentsCE1().then(() => process.exit(0));