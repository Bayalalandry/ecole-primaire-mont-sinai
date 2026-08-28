const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkBayalaAllAssignments() {
  console.log('=== Vérification de TOUTES les assignations de bayala steve ===\n');

  // Récupérer bayala steve
  const { data: bayala } = await supabase
    .from('users')
    .select('id, last_name, first_name')
    .eq('last_name', 'bayala')
    .eq('first_name', 'steve')
    .single();

  if (!bayala) {
    console.error('❌ bayala steve non trouvé');
    return;
  }

  console.log(`✅ bayala steve trouvé (ID: ${bayala.id})`);

  // Récupérer TOUTES les assignations (sans filtre d'année scolaire)
  const { data: allAssignments } = await supabase
    .from('teacher_class_assignments')
    .select(`
      class_id,
      school_year_id,
      classes(name),
      school_years(year_label, is_current)
    `)
    .eq('teacher_id', bayala.id);

  if (!allAssignments || allAssignments.length === 0) {
    console.log('❌ AUCUNE assignation trouvée (toutes années confondues)');
  } else {
    console.log(`✅ ${allAssignments.length} assignation(s) trouvée(s) :\n`);
    allAssignments.forEach((a, index) => {
      console.log(`  ${index + 1}. Classe: ${a.classes?.name}`);
      console.log(`     Année scolaire: ${a.school_years?.year_label} ${a.school_years?.is_current ? '(ACTUELLE)' : ''}`);
      console.log(`     ID année: ${a.school_year_id}`);
      console.log(`     ID classe: ${a.class_id}`);
      console.log('');
    });
  }

  // Comparer avec ce que renvoie getTeacherInfo (sans filtre d'année)
  console.log('=== Ce que renvoie getTeacherInfo (sans filtre d\'année) ===');
  const assignedClasses = allAssignments ? allAssignments.map(a => a.classes?.name).filter(Boolean) : [];
  console.log('Classes assignées:', assignedClasses);
}

checkBayalaAllAssignments().then(() => process.exit(0));
