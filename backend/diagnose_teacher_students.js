const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function diagnoseTeacherStudents() {
  console.log('=== DIAGNOSTIC ENSEIGNANT/ÉLÈVES ===\n');

  try {
    // 1. Récupérer tous les enseignants
    const { data: teachers } = await supabase
      .from('users')
      .select('id, username, first_name, last_name')
      .eq('role', 'teacher');

    console.log('Enseignants trouvés:', teachers?.length || 0);
    teachers?.forEach((t) => {
      console.log(`  - ${t.username} (${t.first_name} ${t.last_name}) - ID: ${t.id}`);
    });

    // 2. Pour chaque enseignant, vérifier ses assignations
    for (const teacher of teachers || []) {
      console.log(`\n--- Enseignant: ${teacher.username} ---`);

      const { data: assignments } = await supabase
        .from('teacher_class_assignments')
        .select('class_id, classes(name)')
        .eq('teacher_id', teacher.id);

      console.log(`Assignations: ${assignments?.length || 0}`);
      assignments?.forEach((a) => {
        console.log(`  - Classe: ${a.classes?.name} (ID: ${a.class_id})`);
      });

      // 3. Vérifier les élèves dans ces classes
      if (assignments && assignments.length > 0) {
        const classIds = assignments.map(a => a.class_id);
        const { data: students } = await supabase
          .from('students')
          .select('id, first_name, last_name, current_class_id, classes(name)')
          .in('current_class_id', classIds);

        console.log(`Élèves dans ces classes: ${students?.length || 0}`);
        students?.forEach((s) => {
          console.log(`  - ${s.first_name} ${s.last_name} - Classe: ${s.classes?.name}`);
        });
      }
    }

    // 4. Vérifier tous les élèves dans la base
    console.log('\n--- TOUS LES ÉLÈVES ---');
    const { data: allStudents } = await supabase
      .from('students')
      .select('id, first_name, last_name, current_class_id, classes(name)');

    console.log(`Total élèves: ${allStudents?.length || 0}`);
    allStudents?.forEach((s) => {
      console.log(`  - ${s.first_name} ${s.last_name} - Classe: ${s.classes?.name || 'Non assigné'}`);
    });

    // 5. Vérifier les classes disponibles
    console.log('\n--- CLASSES DISPONIBLES ---');
    const { data: classes } = await supabase
      .from('classes')
      .select('id, name');

    console.log(`Total classes: ${classes?.length || 0}`);
    classes?.forEach((c) => {
      console.log(`  - ${c.name} (ID: ${c.id})`);
    });

  } catch (error) {
    console.error('Erreur:', error);
  }
}

diagnoseTeacherStudents();
