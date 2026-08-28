const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkAssignmentsStructure() {
  console.log('=== STRUCTURE DE LA TABLE teacher_class_assignments ===\n');

  // Essayer de récupérer toutes les affectations
  const { data: assignments, error } = await supabase
    .from('teacher_class_assignments')
    .select('*');

  if (error) {
    console.error('Erreur:', error);
    return;
  }

  console.log(`Total affectations: ${assignments.length}`);

  if (assignments.length > 0) {
    console.log('\nColonnes disponibles:');
    Object.keys(assignments[0]).forEach(key => {
      console.log(`- ${key}`);
    });

    console.log('\nPremière affectation (exemple):');
    console.log(JSON.stringify(assignments[0], null, 2));
  }
}

checkAssignmentsStructure();
