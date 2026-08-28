const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkClassIds() {
  try {
    console.log('Vérification des IDs des classes CP1 et CM1...');

    // Récupérer toutes les classes
    const { data: classes, error } = await supabase
      .from('classes')
      .select('*')
      .order('name');

    if (error) {
      console.error('Erreur lors de la récupération des classes:', error);
      return;
    }

    console.log('Toutes les classes:');
    classes.forEach(cls => {
      console.log(`- ${cls.name} (ID: ${cls.id})`);
    });

    // Récupérer spécifiquement CP1 et CM1
    const cp1 = classes.find(c => c.name === 'CP1');
    const cm1 = classes.find(c => c.name === 'CM1');

    console.log('\nClasses spécifiques:');
    console.log('CP1:', cp1 ? `ID: ${cp1.id}` : 'Non trouvée');
    console.log('CM1:', cm1 ? `ID: ${cm1.id}` : 'Non trouvée');

    // Vérifier l'assignation du directeur
    const { data: directorAssignments, error: assignError } = await supabase
      .from('teacher_class_assignments')
      .select('*')
      .eq('teacher_id', '9247217b-1017-4872-9ec7-088e5b23393b'); // ID du directeur

    if (assignError) {
      console.error('Erreur lors de la récupération des assignations:', assignError);
    } else {
      console.log('\nAssignations du directeur:');
      directorAssignments.forEach(assign => {
        const className = classes.find(c => c.id === assign.class_id)?.name || 'Inconnue';
        console.log(`- Classe: ${className} (ID: ${assign.class_id}), School Year ID: ${assign.school_year_id}`);
      });
    }

    // Vérifier les élèves par classe
    console.log('\nÉlèves par classe (current_class_id):');
    const classIds = classes.map(c => c.id);
    
    for (const classId of classIds) {
      const className = classes.find(c => c.id === classId)?.name;
      const { data: students } = await supabase
        .from('students')
        .select('first_name, last_name')
        .eq('current_class_id', classId)
        .eq('status', 'active');
      
      if (students && students.length > 0) {
        console.log(`${className} (${classId}): ${students.length} élèves`);
        students.forEach(s => {
          console.log(`  - ${s.first_name} ${s.last_name}`);
        });
      }
    }

  } catch (error) {
    console.error('Erreur inattendue:', error);
  }
}

checkClassIds();