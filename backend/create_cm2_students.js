const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function createCM2Students() {
  console.log('=== CREATION D\'ELEVES CM2 ACTIFS POUR TEST ===\n');

  // Recuperer l'ID de la classe CM2
  const { data: classes } = await supabase
    .from('classes')
    .select('id, name')
    .eq('name', 'CM2')
    .single();

  console.log(`Classe CM2 ID: ${classes.id}`);

  const schoolYear = '2026-2027';
  const timestamp = Date.now().toString().slice(-8);

  const testStudents = [
    { firstName: 'Eleve', lastName: 'CM2-A', matricule: `CM2A${timestamp}` },
    { firstName: 'Eleve', lastName: 'CM2-B', matricule: `CM2B${timestamp}` },
    { firstName: 'Eleve', lastName: 'CM2-C', matricule: `CM2C${timestamp}` },
  ];

  for (const student of testStudents) {
    const randomSuffix = Math.floor(Math.random() * 99).toString().padStart(2, '0');

    const { data: newStudent, error } = await supabase
      .from('students')
      .insert({
        unique_identifier: `ID${timestamp}${randomSuffix}`,
        matricule: student.matricule,
        first_name: student.firstName,
        last_name: student.lastName,
        current_class_id: classes.id,
        school_year: schoolYear,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error(`Erreur creation ${student.lastName}:`, error);
    } else {
      console.log(`OK ${student.firstName} ${student.lastName} cree`);
    }
  }

  console.log('\n=== VERIFICATION ===');
  const { data: activeStudents } = await supabase
    .from('students')
    .select('id, unique_identifier, matricule, first_name, last_name, status')
    .eq('current_class_id', classes.id)
    .eq('status', 'active');

  console.log(`Total eleves actifs en CM2: ${activeStudents.length}`);
  activeStudents.forEach(s => {
    console.log(`- ${s.first_name} ${s.last_name} (${s.matricule})`);
  });
}

createCM2Students();
