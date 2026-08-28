const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkCM2Students() {
  console.log('=== VERIFICATION ELEVES CM2 ===\n');

  const { data: cm2Class } = await supabase
    .from('classes')
    .select('id')
    .eq('name', 'CM2')
    .single();

  const { data: students } = await supabase
    .from('students')
    .select('id, first_name, last_name, unique_identifier, matricule')
    .eq('current_class_id', cm2Class.id)
    .eq('status', 'active');

  console.log(`Total eleves: ${students.length}`);
  students.forEach(s => {
    console.log(`- ID: ${s.id}`);
    console.log(`  First Name: ${s.first_name}`);
    console.log(`  Last Name: ${s.last_name}`);
    console.log(`  Matricule: ${s.matricule}`);
    console.log(`  Unique ID: ${s.unique_identifier}`);
    console.log();
  });
}

checkCM2Students();
