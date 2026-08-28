const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function createCE1Students() {
  console.log('=== CREATION D\'ELEVES CE1 ACTIFS POUR TEST ===\n');

  // Récupérer l'ID de la classe CE1
  const { data: ce1Class } = await supabase
    .from('classes')
    .select('id, name')
    .eq('name', 'CE1')
    .single();

  console.log(`Classe CE1 ID: ${ce1Class.id}`);

  const schoolYear = '2026-2027';
  const timestamp = Date.now().toString().slice(-8);

  const testStudents = [
    { firstName: 'Eleve', lastName: 'CE1-A', matricule: `CE1A${timestamp}` },
    { firstName: 'Eleve', lastName: 'CE1-B', matricule: `CE1B${timestamp}` },
    { firstName: 'Eleve', lastName: 'CE1-C', matricule: `CE1C${timestamp}` },
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
        current_class_id: ce1Class.id,
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
    .eq('current_class_id', ce1Class.id)
    .eq('status', 'active');

  console.log(`Total eleves actifs en CE1: ${activeStudents.length}`);
  activeStudents.forEach(s => {
    console.log(`- ${s.first_name} ${s.last_name} (${s.matricule})`);
  });
}

createCE1Students();
