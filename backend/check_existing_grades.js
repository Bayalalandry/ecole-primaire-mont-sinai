const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkExistingGrades() {
  console.log('=== VERIFICATION DES NOTES EXISTANTES ===\n');

  // Recuperer l'ID de l'annee scolaire 2026-2027
  const { data: schoolYear } = await supabase
    .from('school_years')
    .select('id')
    .eq('year_label', '2026-2027')
    .single();

  console.log(`Annee scolaire ID: ${schoolYear.id}`);

  // Recuperer tous les enregistrements pour cette annee
  const { data: grades } = await supabase
    .from('student_annual_grades')
    .select('*')
    .eq('school_year_id', schoolYear.id);

  console.log(`\nTotal enregistrements de notes: ${grades.length}`);

  if (grades.length > 0) {
    console.log('\nListe des enregistrements:');
    grades.forEach(g => {
      console.log(`- Student ID: ${g.student_id}, Grade: ${g.final_grade}`);
    });

    // Optionnel: Supprimer ces enregistrements pour reinitialiser
    console.log('\n=== SUPPRESSION DES ENREGISTREMENTS EXISTANTS ===');
    const { error } = await supabase
      .from('student_annual_grades')
      .delete()
      .eq('school_year_id', schoolYear.id);

    if (error) {
      console.error('Erreur suppression:', error);
    } else {
      console.log('OK - Tous les enregistrements ont ete supprimes');
    }
  } else {
    console.log('Aucun enregistrement existant');
  }
}

checkExistingGrades();
