const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function restoreCP1Students() {
  try {
    console.log('Restauration des élèves dans CP1...');

    // Récupérer les IDs des classes
    const { data: classes } = await supabase
      .from('classes')
      .select('*');

    const cp1Class = classes.find(c => c.name === 'CP1');
    const cp2Class = classes.find(c => c.name === 'CP2');

    if (!cp1Class || !cp2Class) {
      console.error('Classes CP1 ou CP2 non trouvées');
      return;
    }

    console.log('CP1 ID:', cp1Class.id);
    console.log('CP2 ID:', cp2Class.id);

    // Récupérer les élèves actuels de CP2
    const { data: cp2Students, error } = await supabase
      .from('students')
      .select('*')
      .eq('current_class_id', cp2Class.id)
      .eq('status', 'active');

    if (error) {
      console.error('Erreur lors de la récupération des élèves CP2:', error);
      return;
    }

    console.log('Élèves actuellement dans CP2:', cp2Students.length);
    cp2Students.forEach(s => {
      console.log(`- ${s.first_name} ${s.last_name}`);
    });

    // Déplacer tous les élèves de CP2 vers CP1 sauf Test Élève1 et Test Élève2
    const studentsToMove = cp2Students.filter(s => 
      s.first_name !== 'Élève1' && s.first_name !== 'Élève2'
    );

    console.log(`\nÉlèves à déplacer de CP2 vers CP1: ${studentsToMove.length}`);

    for (const student of studentsToMove) {
      const { error: updateError } = await supabase
        .from('students')
        .update({ current_class_id: cp1Class.id })
        .eq('id', student.id);

      if (updateError) {
        console.error(`Erreur lors du déplacement de ${student.first_name} ${student.last_name}:`, updateError);
      } else {
        console.log(`✅ ${student.first_name} ${student.last_name} déplacé vers CP1`);
      }
    }

    // Vérifier le résultat
    const { data: newCP1Students } = await supabase
      .from('students')
      .select('first_name, last_name')
      .eq('current_class_id', cp1Class.id)
      .eq('status', 'active');

    const { data: newCP2Students } = await supabase
      .from('students')
      .select('first_name, last_name')
      .eq('current_class_id', cp2Class.id)
      .eq('status', 'active');

    console.log('\n--- RÉSULTAT ---');
    console.log(`CP1 (${cp1Class.id}): ${newCP1Students?.length || 0} élèves`);
    newCP1Students?.forEach(s => console.log(`  - ${s.first_name} ${s.last_name}`));
    
    console.log(`\nCP2 (${cp2Class.id}): ${newCP2Students?.length || 0} élèves`);
    newCP2Students?.forEach(s => console.log(`  - ${s.first_name} ${s.last_name}`));

  } catch (error) {
    console.error('Erreur inattendue:', error);
  }
}

restoreCP1Students();