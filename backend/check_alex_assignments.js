const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkAlexAssignments() {
  console.log('=== VERIFICATION ASSIGNATIONS ALEX ===\n');

  // Récupérer l'utilisateur ALEX
  const { data: alex } = await supabase
    .from('users')
    .select('id, username, role')
    .ilike('username', 'alex')
    .maybeSingle();

  if (!alex) {
    console.log('Utilisateur ALEX non trouve');
    return;
  }

  console.log(`ALEX ID: ${alex.id}, Role: ${alex.role}`);

  // Récupérer l'année scolaire actuelle
  const { data: schoolYear } = await supabase
    .from('school_years')
    .select('id, year_label')
    .eq('year_label', '2026-2027')
    .single();

  console.log(`Annee scolaire: ${schoolYear.year_label} (ID: ${schoolYear.id})`);

  // Récupérer les assignations de ALEX
  const { data: assignments } = await supabase
    .from('teacher_class_assignments')
    .select('*, classes(name)')
    .eq('teacher_id', alex.id);

  console.log(`\nTotal assignations: ${assignments.length}`);
  assignments.forEach(a => {
    console.log(`- Classe: ${a.classes.name}, School Year ID: ${a.school_year_id}`);
  });

  // Vérifier si CM2 est assigné avec le bon school_year_id
  const cm2Assignment = assignments.find(a => a.classes.name === 'CM2');
  if (cm2Assignment) {
    console.log(`\nAssignation CM2 trouvee:`);
    console.log(`- School Year ID: ${cm2Assignment.school_year_id}`);
    console.log(`- Correspond a l'annee actuelle: ${cm2Assignment.school_year_id === schoolYear.id ? 'OUI' : 'NON'}`);
  } else {
    console.log('\nAucune assignation CM2 trouvee');
  }
}

checkAlexAssignments();
