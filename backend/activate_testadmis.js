const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function activateTestAdmis() {
  try {
    console.log('Activation de l\'élève TestAdmis Sur10...');

    // Changer le statut de 'repeating' à 'active'
    const { error } = await supabase
      .from('students')
      .update({ status: 'active' })
      .eq('first_name', 'TestAdmis')
      .eq('last_name', 'Sur10');

    if (error) {
      console.error('Erreur lors de l\'activation:', error);
      return;
    }

    console.log('✅ TestAdmis Sur10 activé (statut: active)');

    // Vérification finale
    const { data: classes } = await supabase
      .from('classes')
      .select('*');

    const { data: activeStudents } = await supabase
      .from('students')
      .select('first_name, last_name, current_class_id')
      .eq('status', 'active');

    const studentsByClass = {};
    activeStudents?.forEach(s => {
      if (!studentsByClass[s.current_class_id]) {
        studentsByClass[s.current_class_id] = [];
      }
      studentsByClass[s.current_class_id].push(`${s.first_name} ${s.last_name}`);
    });

    console.log('\n--- DISTRIBUTION FINALE DES ÉLÈVES ACTIFS ---');
    Object.entries(studentsByClass).forEach(([classId, names]) => {
      const className = classes.find(c => c.id === classId)?.name || 'Inconnue';
      console.log(`${className} (${classId}): ${names.length} élèves`);
      names.forEach(name => console.log(`  - ${name}`));
    });

  } catch (error) {
    console.error('Erreur inattendue:', error);
  }
}

activateTestAdmis();