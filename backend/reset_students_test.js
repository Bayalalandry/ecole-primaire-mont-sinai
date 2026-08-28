const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function resetStudents() {
  console.log('=== RESET DES ELEVES POUR TEST ===\n');

  // Réinitialiser tous les élèves de CM2 à l'état actif
  const { data: cm2Class } = await supabase
    .from('classes')
    .select('id')
    .eq('name', 'CM2')
    .single();

  const { error } = await supabase
    .from('students')
    .update({
      status: 'active',
      school_year: '2026-2027',
    })
    .eq('current_class_id', cm2Class.id);

  if (error) {
    console.error('Erreur reset:', error);
  } else {
    console.log('OK - Eleves reinitialises');
  }

  // Supprimer les notes existantes
  const { data: schoolYear } = await supabase
    .from('school_years')
    .select('id')
    .eq('year_label', '2026-2027')
    .single();

  const { error: deleteError } = await supabase
    .from('student_annual_grades')
    .delete()
    .eq('school_year_id', schoolYear.id);

  if (deleteError) {
    console.error('Erreur suppression notes:', deleteError);
  } else {
    console.log('OK - Notes supprimees');
  }
}

resetStudents();
