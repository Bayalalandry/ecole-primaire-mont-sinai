const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkCM2Students() {
  console.log('=== VERIFICATION DES ELEVES CM2 ===\n');

  // Recuperer l'ID de la classe CM2
  const { data: classes } = await supabase
    .from('classes')
    .select('id, name')
    .eq('name', 'CM2')
    .single();

  console.log(`Classe CM2 ID: ${classes.id}`);

  // Recuperer tous les eleves avec current_class_id = CM2
  const { data: allCM2Students } = await supabase
    .from('students')
    .select('id, unique_identifier, matricule, first_name, last_name, school_year, status')
    .eq('current_class_id', classes.id);

  console.log(`Total eleves avec current_class_id = CM2: ${allCM2Students.length}`);

  if (allCM2Students.length > 0) {
    console.log('\nDetails:');
    allCM2Students.forEach(s => {
      console.log(`- ${s.first_name} ${s.last_name} (${s.matricule}) - school_year: ${s.school_year}, status: ${s.status}`);
    });
  }

  // Recuperer les eleves avec current_class_id = CM2 ET school_year = 2026-2027
  const { data: currentYearStudents } = await supabase
    .from('students')
    .select('id, unique_identifier, matricule, first_name, last_name, school_year, status')
    .eq('current_class_id', classes.id)
    .eq('school_year', '2026-2027');

  console.log(`\nTotal eleves avec current_class_id = CM2 ET school_year = 2026-2027: ${currentYearStudents.length}`);

  if (currentYearStudents.length > 0) {
    console.log('\nDetails (2026-2027):');
    currentYearStudents.forEach(s => {
      console.log(`- ${s.first_name} ${s.last_name} (${s.matricule}) - status: ${s.status}`);
    });
  }

  // Recuperer les eleves actifs uniquement
  const { data: activeStudents } = await supabase
    .from('students')
    .select('id, unique_identifier, matricule, first_name, last_name, school_year, status')
    .eq('current_class_id', classes.id)
    .eq('status', 'active');

  console.log(`\nTotal eleves actifs avec current_class_id = CM2: ${activeStudents.length}`);

  if (activeStudents.length > 0) {
    console.log('\nDetails (actifs):');
    activeStudents.forEach(s => {
      console.log(`- ${s.first_name} ${s.last_name} (${s.matricule}) - school_year: ${s.school_year}`);
    });
  }
}

checkCM2Students();
