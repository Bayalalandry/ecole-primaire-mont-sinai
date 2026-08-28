const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function findTestAdmis() {
  try {
    console.log('Recherche de l\'élève TestAdmis...');

    // Récupérer toutes les classes
    const { data: classes } = await supabase
      .from('classes')
      .select('*');

    // Rechercher l'élève TestAdmis
    const { data: students, error } = await supabase
      .from('students')
      .select('*')
      .ilike('first_name', '%TestAdmis%');

    if (error) {
      console.error('Erreur lors de la recherche:', error);
      return;
    }

    console.log('Élèves trouvés avec "TestAdmis" dans le prénom:', students?.length || 0);
    students?.forEach(s => {
      const className = classes.find(c => c.id === s.current_class_id)?.name || 'Inconnue';
      console.log(`- ${s.first_name} ${s.last_name} (ID: ${s.id})`);
      console.log(`  Classe actuelle: ${className} (ID: ${s.current_class_id})`);
      console.log(`  Statut: ${s.status}`);
    });

    // Si l'élève est trouvé et n'est pas dans CP1, le déplacer
    if (students && students.length > 0) {
      const testAdmis = students[0];
      const cp1Class = classes.find(c => c.name === 'CP1');

      if (cp1Class && testAdmis.current_class_id !== cp1Class.id) {
        console.log(`\nDéplacement de ${testAdmis.first_name} ${testAdmis.last_name} vers CP1...`);

        const { error: updateError } = await supabase
          .from('students')
          .update({ current_class_id: cp1Class.id })
          .eq('id', testAdmis.id);

        if (updateError) {
          console.error('Erreur lors du déplacement:', updateError);
        } else {
          console.log('✅ Déplacement réussi');
        }
      }
    }

    // Vérification finale
    console.log('\n--- VÉRIFICATION FINALE ---');
    const { data: allStudents } = await supabase
      .from('students')
      .select('first_name, last_name, current_class_id')
      .eq('status', 'active');

    const studentsByClass = {};
    allStudents?.forEach(s => {
      if (!studentsByClass[s.current_class_id]) {
        studentsByClass[s.current_class_id] = [];
      }
      studentsByClass[s.current_class_id].push(`${s.first_name} ${s.last_name}`);
    });

    Object.entries(studentsByClass).forEach(([classId, names]) => {
      const className = classes.find(c => c.id === classId)?.name || 'Inconnue';
      console.log(`${className} (${classId}): ${names.length} élèves`);
      names.forEach(name => console.log(`  - ${name}`));
    });

  } catch (error) {
    console.error('Erreur inattendue:', error);
  }
}

findTestAdmis();