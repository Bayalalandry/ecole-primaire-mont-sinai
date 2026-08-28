const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function cleanupOrphanAssignments() {
  console.log('=== Nettoyage des assignations orphelines (school_year_id = null) ===\n');

  // Récupérer toutes les assignations avec school_year_id = null
  const { data: orphanAssignments, error } = await supabase
    .from('teacher_class_assignments')
    .select('id, teacher_id, class_id, classes(name)')
    .is('school_year_id', null);

  if (error) {
    console.error('Erreur:', error);
    return;
  }

  if (!orphanAssignments || orphanAssignments.length === 0) {
    console.log('✅ Aucune assignation orpheline trouvée');
    return;
  }

  console.log(`⚠️  ${orphanAssignments.length} assignation(s) orpheline(s) trouvée(s) :\n`);
  orphanAssignments.forEach((a, index) => {
    console.log(`  ${index + 1}. Teacher ID: ${a.teacher_id} → ${a.classes?.name} (Assignment ID: ${a.id})`);
  });

  // Supprimer ces assignations
  console.log('\n🗑️  Suppression en cours...');
  const { error: deleteError } = await supabase
    .from('teacher_class_assignments')
    .delete()
    .is('school_year_id', null);

  if (deleteError) {
    console.error('❌ Erreur lors de la suppression:', deleteError);
  } else {
    console.log('✅ Assignations orphelines supprimées avec succès');
  }
}

cleanupOrphanAssignments().then(() => process.exit(0));
