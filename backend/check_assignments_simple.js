const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkAssignmentsSimple() {
  console.log('=== Vérification des affectations enseignant-classe ===\n');
  
  try {
    const { data, error } = await supabase
      .from('teacher_class_assignments')
      .select('*');
    
    if (error) {
      console.log('Erreur:', error.message);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log('Aucune affectation enseignant-classe trouvée');
      console.log('\nPour créer une affectation, vous devez insérer dans teacher_class_assignments:');
      console.log('INSERT INTO teacher_class_assignments (teacher_id, class_id, school_year)');
      console.log('VALUES (user_id, class_id, "2024-2025");');
      return;
    }
    
    console.log(`${data.length} affectation(s) trouvée(s):`);
    data.forEach((a, i) => {
      console.log(`  ${i + 1}. Teacher ID: ${a.teacher_id} -> Class ID: ${a.class_id} (${a.school_year})`);
    });
    
  } catch (error) {
    console.log('Erreur:', error.message);
  }
}

checkAssignmentsSimple().then(() => process.exit(0));