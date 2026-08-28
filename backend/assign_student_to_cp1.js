const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function assignStudentToCP1() {
  try {
    console.log('Assignation d\'un élève à la classe CP1...');

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

    // Récupérer un élève actif
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('status', 'active')
      .limit(1)
      .single();

    if (studentError || !student) {
      console.error('Erreur lors de la récupération d\'un élève:', studentError);
      return;
    }

    console.log('Élève trouvé:', student.first_name, student.last_name, 'ID:', student.id);
    console.log('Current class avant:', student.current_class_id);

    // Assigner l'élève à CP1
    const { error: updateError } = await supabase
      .from('students')
      .update({ current_class_id: cp1Class.id })
      .eq('id', student.id);

    if (updateError) {
      console.error('Erreur lors de l\'assignation:', updateError);
      return;
    }

    console.log('✅ Succès ! Élève assigné à CP1');
    console.log('Élève:', student.first_name, student.last_name);
    console.log('Nouvelle classe:', cp1Class.name);

  } catch (error) {
    console.error('Erreur inattendue:', error);
  }
}

assignStudentToCP1();