const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testGlobalSearch() {
  console.log('=== TEST RECHERCHE GLOBALE ===\n');

  // Test 1: Rechercher un élève par nom
  console.log('--- TEST 1: Recherche eleve par nom ---');
  const { data: studentsByName } = await supabase
    .from('students')
    .select('id, first_name, last_name, matricule')
    .or(`first_name.ilike.%steve%,last_name.ilike.%steve%`)
    .limit(5);

  console.log('Resultats: ' + (studentsByName?.length || 0));
  studentsByName?.forEach(s => {
    console.log('- ' + s.first_name + ' ' + s.last_name + ' (' + s.matricule + ')');
  });

  // Test 2: Rechercher un élève par matricule
  console.log('\n--- TEST 2: Recherche eleve par matricule ---');
  const { data: studentsByMatricule } = await supabase
    .from('students')
    .select('id, first_name, last_name, matricule')
    .like('matricule', '%ECO%')
    .limit(5);

  console.log('Resultats: ' + (studentsByMatricule?.length || 0));
  studentsByMatricule?.forEach(s => {
    console.log('- ' + s.first_name + ' ' + s.last_name + ' (' + s.matricule + ')');
  });

  // Test 3: Rechercher un enseignant par nom
  console.log('\n--- TEST 3: Recherche enseignant par nom ---');
  const { data: teachers } = await supabase
    .from('users')
    .select('id, first_name, last_name, username')
    .eq('role', 'teacher')
    .or(`first_name.ilike.%alex%,last_name.ilike.%alex%`)
    .limit(5);

  console.log('Resultats: ' + (teachers?.length || 0));
  teachers?.forEach(t => {
    console.log('- ' + t.first_name + ' ' + t.last_name + ' (@' + t.username + ')');
  });

  console.log('\n=== TEST RECHERCHE GLOBALE TERMINE ===');
}

testGlobalSearch();
