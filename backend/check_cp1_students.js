const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkCP1Students() {
  try {
    console.log('Vérification des élèves de la classe CP1...');

    // Récupérer la classe CP1
    const { data: cp1Class, error: classError } = await supabase
      .from('classes')
      .select('*')
      .eq('name', 'CP1')
      .single();

    if (classError || !cp1Class) {
      console.error('Erreur lors de la récupération de la classe CP1:', classError);
      return;
    }

    console.log('Classe CP1 ID:', cp1Class.id);

    // Récupérer les élèves avec current_class_id = CP1
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .eq('current_class_id', cp1Class.id)
      .eq('status', 'active');

    if (studentsError) {
      console.error('Erreur lors de la récupération des élèves:', studentsError);
      return;
    }

    console.log('Élèves actifs avec current_class_id = CP1:', students?.length || 0);
    console.log('Détails des élèves:', students);

    // Vérifier tous les élèves actifs
    const { data: allActiveStudents, error: allError } = await supabase
      .from('students')
      .select('*')
      .eq('status', 'active');

    if (allError) {
      console.error('Erreur lors de la récupération de tous les élèves:', allError);
    } else {
      console.log('\nTous les élèves actifs:', allActiveStudents?.length || 0);
      allActiveStudents?.forEach(student => {
        console.log(`- ${student.first_name} ${student.last_name} (ID: ${student.id}, current_class_id: ${student.current_class_id})`);
      });
    }

  } catch (error) {
    console.error('Erreur inattendue:', error);
  }
}

checkCP1Students();