const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function moveSteveLandryToCM1() {
  try {
    console.log('Déplacement de steve landry vers CM1...');

    // Récupérer les IDs des classes
    const { data: classes } = await supabase
      .from('classes')
      .select('*');

    const cp1Class = classes.find(c => c.name === 'CP1');
    const cm1Class = classes.find(c => c.name === 'CM1');

    if (!cp1Class || !cm1Class) {
      console.error('Classes CP1 ou CM1 non trouvées');
      return;
    }

    console.log('CP1 ID:', cp1Class.id);
    console.log('CM1 ID:', cm1Class.id);

    // Trouver steve landry
    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('first_name', 'steve')
      .eq('last_name', 'landry')
      .single();

    if (error || !student) {
      console.error('Erreur lors de la recherche de steve landry:', error);
      return;
    }

    console.log('steve landry trouvé, ID:', student.id);
    console.log('Classe actuelle:', student.current_class_id);

    // Déplacer vers CM1
    const { error: updateError } = await supabase
      .from('students')
      .update({ current_class_id: cm1Class.id })
      .eq('id', student.id);

    if (updateError) {
      console.error('Erreur lors du déplacement:', updateError);
      return;
    }

    console.log('✅ steve landry déplacé vers CM1');

    // Vérifier le résultat
    const { data: cp1Students } = await supabase
      .from('students')
      .select('first_name, last_name')
      .eq('current_class_id', cp1Class.id)
      .eq('status', 'active');

    console.log('\nCP1 maintenant contient:', cp1Students?.length || 0, 'élèves');
    cp1Students?.forEach(s => console.log(`  - ${s.first_name} ${s.last_name}`));

  } catch (error) {
    console.error('Erreur inattendue:', error);
  }
}

moveSteveLandryToCM1();