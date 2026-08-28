const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function resetStudentsForTest() {
  console.log('=== RESET DES ELEVES POUR NOUVEAU TEST ===\n');

  // Réinitialiser tous les élèves à 'active'
  const { error: updateError } = await supabase
    .from('students')
    .update({
      status: 'active',
      departure_reason: null,
      departure_date: null,
    })
    .neq('status', 'active');

  if (updateError) {
    console.error('Erreur reset status:', updateError);
  } else {
    console.log('OK - Status des eleves reinitialises');
  }

  // Supprimer toutes les décisions de passage
  const { error: deleteDecisionsError } = await supabase
    .from('passage_decisions')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (deleteDecisionsError) {
    console.error('Erreur suppression decisions:', deleteDecisionsError);
  } else {
    console.log('OK - Decisions de passage supprimees');
  }

  // Supprimer l'historique scolaire de test
  const { error: deleteHistoryError } = await supabase
    .from('student_academic_history')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (deleteHistoryError) {
    console.error('Erreur suppression historique:', deleteHistoryError);
  } else {
    console.log('OK - Historique scolaire supprime');
  }

  // Réinitialiser les notes
  const { data: schoolYear } = await supabase
    .from('school_years')
    .select('id')
    .eq('year_label', '2026-2027')
    .single();

  const { error: deleteGradesError } = await supabase
    .from('student_annual_grades')
    .delete()
    .eq('school_year_id', schoolYear.id);

  if (deleteGradesError) {
    console.error('Erreur suppression notes:', deleteGradesError);
  } else {
    console.log('OK - Notes supprimees');
  }

  console.log('\n=== RESET TERMINE ===');
}

resetStudentsForTest();
