const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkSchoolYears() {
  console.log('=== VERIFICATION DES ANNEES SCOLAIRES ===\n');

  const { data: schoolYears } = await supabase
    .from('school_years')
    .select('*');

  console.log(`Annees scolaires disponibles: ${schoolYears.length}`);
  schoolYears.forEach(sy => {
    console.log(`- ${sy.year_label} (${sy.id})`);
  });

  console.log('\n=== VERIFICATION DES AFFECTATIONS ===');
  const { data: assignments } = await supabase
    .from('teacher_class_assignments')
    .select('*');

  console.log(`Total affectations: ${assignments.length}`);
  assignments.forEach(a => {
    console.log(`- Enseignant: ${a.teacher_id}, Classe: ${a.class_id}, school_year_id: ${a.school_year_id}`);
  });
}

checkSchoolYears();
