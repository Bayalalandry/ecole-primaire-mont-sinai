const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function createAssignments() {
  console.log('=== Création des affectations enseignant-classe ===\n');
  
  try {
    // Récupérer les enseignants
    const { data: teachers, error: teachersError } = await supabase
      .from('users')
      .select('id, first_name, last_name')
      .eq('role', 'teacher');
    
    if (teachersError) {
      console.log('Erreur enseignants:', teachersError.message);
      return;
    }
    
    console.log('Enseignants trouvés:');
    teachers.forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.first_name} ${t.last_name} (ID: ${t.id})`);
    });
    
    // Récupérer les classes
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select('id, name');
    
    if (classesError) {
      console.log('Erreur classes:', classesError.message);
      return;
    }
    
    console.log('\nClasses trouvées:');
    classes.forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.name} (ID: ${c.id})`);
    });
    
    // Créer des affectations
    console.log('\nCréation des affectations...');
    
    const assignments = [
      { teacher_id: teachers[0].id, class_id: classes[0].id }, // CP1
      { teacher_id: teachers[1].id, class_id: classes[2].id }, // CE1
    ];
    
    for (const assignment of assignments) {
      const { error } = await supabase
        .from('teacher_class_assignments')
        .insert(assignment);
      
      if (error) {
        console.log(`Erreur pour l'affectation:`, error.message);
      } else {
        console.log(`✅ Affectation créée`);
      }
    }
    
  } catch (error) {
    console.log('Erreur:', error.message);
  }
}

createAssignments().then(() => process.exit(0));