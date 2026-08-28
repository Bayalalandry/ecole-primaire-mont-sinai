const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function fixTeacherAssignments() {
  console.log('=== MISE À JOUR DES AFFECTATIONS ENSEIGNANT-CLASSE ===\n');

  const schoolYear = '2025-2026';

  // Récupérer toutes les affectations sans année scolaire
  const { data: assignments, error } = await supabase
    .from('teacher_class_assignments')
    .select('*')
    .is('school_year', null);

  if (error) {
    console.error('Erreur lors de la récupération:', error);
    return;
  }

  console.log(`Affectations sans année scolaire: ${assignments?.length || 0}`);

  if (!assignments || assignments.length === 0) {
    console.log('Aucune affectation à mettre à jour');
    return;
  }

  // Mettre à jour chaque affectation
  for (const assignment of assignments) {
    const { error } = await supabase
      .from('teacher_class_assignments')
      .update({ school_year: schoolYear })
      .eq('id', assignment.id);

    if (error) {
      console.error(`Erreur pour l'affectation ${assignment.id}:`, error);
    } else {
      console.log(`✓ Affectation ${assignment.id} mise à jour avec ${schoolYear}`);
    }
  }

  console.log('\n=== VÉRIFICATION ===');
  const { data: updatedAssignments } = await supabase
    .from('teacher_class_assignments')
    .select('*');

  updatedAssignments.forEach(a => {
    console.log(`- Enseignant: ${a.teacher_id}, Classe: ${a.class_id}, Année: ${a.school_year}`);
  });

  console.log('\n✓ Affectations mises à jour avec succès');
}

fixTeacherAssignments();
