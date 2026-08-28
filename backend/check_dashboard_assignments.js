const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkDashboardAssignments() {
  console.log('=== Vérification des assignations pour les dashboards ===\n');

  // 1. Récupérer l'année scolaire actuelle
  const { data: currentYear, error: yearError } = await supabase
    .from('school_years')
    .select('*')
    .eq('is_current', true)
    .single();

  if (yearError || !currentYear) {
    console.log('Erreur année scolaire:', yearError);
    return;
  }

  console.log('Année scolaire actuelle:', currentYear.year_label, '(ID:', currentYear.id, ')\n');

  // 2. Vérifier les enseignants
  const { data: teachers, error: teachersError } = await supabase
    .from('users')
    .select('id, username, first_name, last_name')
    .eq('role', 'teacher');

  if (teachersError) {
    console.log('Erreur enseignants:', teachersError);
    return;
  }

  console.log('Enseignants trouvés:', teachers.length);
  for (const teacher of teachers) {
    console.log(`\n--- Enseignant: ${teacher.username} (${teacher.first_name} ${teacher.last_name}) ---`);

    // Récupérer les classes assignées
    const { data: assignments, error: assignError } = await supabase
      .from('teacher_class_assignments')
      .select('class_id, classes(id, name)')
      .eq('teacher_id', teacher.id)
      .eq('school_year_id', currentYear.id);

    if (assignError) {
      console.log('Erreur assignations:', assignError);
      continue;
    }

    if (!assignments || assignments.length === 0) {
      console.log('  Aucune classe assignée pour cette année scolaire');
      continue;
    }

    console.log(`  Classes assignées (${assignments.length}):`);
    const classIds = assignments.map(a => a.class_id);

    let totalStudents = 0;
    for (const assignment of assignments) {
      const className = assignment.classes?.name || 'Inconnu';
      const classId = assignment.class_id;

      // Compter les élèves actifs dans cette classe
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, first_name, last_name, current_class_id')
        .eq('current_class_id', classId)
        .eq('status', 'active');

      if (studentsError) {
        console.log(`    Erreur élèves pour ${className}:`, studentsError);
        continue;
      }

      const count = students?.length || 0;
      totalStudents += count;
      console.log(`    - ${className} (ID: ${classId}): ${count} élèves actifs`);

      if (count > 0 && count <= 5) {
        console.log(`      Élèves: ${students.map(s => s.first_name + ' ' + s.last_name).join(', ')}`);
      }
    }

    console.log(`  Total élèves dans toutes les classes: ${totalStudents}`);
  }

  // 3. Vérifier le directeur
  console.log('\n\n=== Directeur ===');
  const { data: director, error: directorError } = await supabase
    .from('users')
    .select('id, username, first_name, last_name')
    .eq('role', 'director');

  if (directorError) {
    console.log('Erreur directeur:', directorError);
    return;
  }

  if (!director || director.length === 0) {
    console.log('Aucun directeur trouvé');
    return;
  }

  const dir = director[0];
  console.log(`Directeur: ${dir.username} (${dir.first_name} ${dir.last_name})`);

  // Récupérer les classes assignées au directeur
  const { data: dirAssignments, error: dirAssignError } = await supabase
    .from('teacher_class_assignments')
    .select('class_id, classes(id, name)')
    .eq('teacher_id', dir.id)
    .eq('school_year_id', currentYear.id);

  if (dirAssignError) {
    console.log('Erreur assignations directeur:', dirAssignError);
    return;
  }

  if (!dirAssignments || dirAssignments.length === 0) {
    console.log('  Aucune classe assignée au directeur pour cette année scolaire');
    console.log('  => Le bouton "Passage de Classe" ne devrait PAS apparaître (normal)');
  } else {
    console.log(`  Classes assignées au directeur (${dirAssignments.length}):`);
    dirAssignments.forEach(a => {
      console.log(`    - ${a.classes?.name || 'Inconnu'} (ID: ${a.class_id})`);
    });
    console.log('  => Le bouton "Passage de Classe" DEVRAIT apparaître');
  }
}

checkDashboardAssignments()
  .then(() => console.log('\nVérification terminée'))
  .catch(err => console.error('Erreur:', err));
