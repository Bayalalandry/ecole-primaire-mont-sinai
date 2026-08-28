const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkTeacherAssignments() {
  console.log('=== Vérification des assignations enseignant-classe ===\n');

  // Récupérer tous les enseignants
  const { data: teachers, error: teachersError } = await supabase
    .from('users')
    .select('id, last_name, first_name, role')
    .in('role', ['teacher', 'director']);

  if (teachersError) {
    console.error('Erreur récupération enseignants:', teachersError);
    return;
  }

  console.log(`Enseignants trouvés: ${teachers.length}\n`);

  // Récupérer l'année scolaire actuelle
  const { data: currentYear } = await supabase
    .from('school_years')
    .select('id, year_label')
    .eq('is_current', true)
    .single();

  console.log(`Année scolaire actuelle: ${currentYear?.year_label} (ID: ${currentYear?.id})\n`);

  // Pour chaque enseignant, vérifier ses assignations
  for (const teacher of teachers) {
    console.log(`--- ${teacher.last_name} ${teacher.first_name} (${teacher.role}) ---`);

    const { data: assignments, error: assignmentsError } = await supabase
      .from('teacher_class_assignments')
      .select(`
        class_id,
        school_year_id,
        classes(id, name)
      `)
      .eq('teacher_id', teacher.id)
      .eq('school_year_id', currentYear?.id);

    if (assignmentsError) {
      console.error(`  Erreur: ${assignmentsError.message}`);
    } else if (!assignments || assignments.length === 0) {
      console.log('  ❌ Aucune assignation pour cette année scolaire');
    } else {
      console.log(`  ✅ ${assignments.length} assignation(s):`);
      assignments.forEach(a => {
        console.log(`     - ${a.classes?.name} (ID: ${a.class_id})`);
      });
    }
    console.log('');
  }

  // Vérifier si bayala steve existe
  const { data: bayala } = await supabase
    .from('users')
    .select('id, last_name, first_name, role')
    .eq('last_name', 'bayala')
    .eq('first_name', 'steve')
    .single();

  if (bayala) {
    console.log(`=== bayala steve trouvé (ID: ${bayala.id}) ===`);

    const { data: bayalaAssignments } = await supabase
      .from('teacher_class_assignments')
      .select(`
        class_id,
        school_year_id,
        classes(id, name)
      `)
      .eq('teacher_id', bayala.id)
      .eq('school_year_id', currentYear?.id);

    if (!bayalaAssignments || bayalaAssignments.length === 0) {
      console.log('❌ bayala steve n\'a AUCUNE assignation!');
      console.log('Il faut l\'assigner à une classe dans la page Gestion du Personnel');
    } else {
      console.log(`✅ bayala steve a ${bayalaAssignments.length} assignation(s):`);
      bayalaAssignments.forEach(a => {
        console.log(`   - ${a.classes?.name} (ID: ${a.class_id})`);
      });
    }
  } else {
    console.log('❌ bayala steve NON trouvé dans la base de données');
  }
}

checkTeacherAssignments().then(() => process.exit(0));
