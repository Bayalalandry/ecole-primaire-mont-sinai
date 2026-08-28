const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function fixAssignmentsSchoolYearId() {
  console.log('=== MISE À JOUR DES AFFECTATIONS AVEC school_year_id ===\n');

  const schoolYearLabel = '2025-2026';

  // Récupérer ou créer l'année scolaire
  let schoolYearId;
  const { data: existingSchoolYear } = await supabase
    .from('school_years')
    .select('id')
    .eq('year_label', schoolYearLabel)
    .maybeSingle();

  if (!existingSchoolYear) {
    console.log('Creation de l\'annee scolaire...');
    const { data: newSchoolYear } = await supabase
      .from('school_years')
      .insert({
        year_label: schoolYearLabel,
        start_date: '2025-09-01',
        end_date: '2026-07-31',
      })
      .select()
      .single();
    schoolYearId = newSchoolYear.id;
  } else {
    schoolYearId = existingSchoolYear.id;
  }

  console.log(`Annee scolaire ID: ${schoolYearId}`);

  // Récupérer toutes les affectations sans school_year_id
  const { data: assignments } = await supabase
    .from('teacher_class_assignments')
    .select('*')
    .is('school_year_id', null);

  console.log(`Affectations sans school_year_id: ${assignments?.length || 0}`);

  if (!assignments || assignments.length === 0) {
    console.log('Aucune affectation a mettre a jour');
    return;
  }

  // Mettre à jour chaque affectation
  for (const assignment of assignments) {
    const { error } = await supabase
      .from('teacher_class_assignments')
      .update({ school_year_id: schoolYearId })
      .eq('id', assignment.id);

    if (error) {
      console.error(`Erreur pour l'affectation ${assignment.id}:`, error);
    } else {
      console.log(`OK Affectation ${assignment.id} mise a jour avec school_year_id ${schoolYearId}`);
    }
  }

  console.log('\n=== VERIFICATION ===');
  const { data: updatedAssignments } = await supabase
    .from('teacher_class_assignments')
    .select('*');

  updatedAssignments.forEach(a => {
    console.log(`- Enseignant: ${a.teacher_id}, Classe: ${a.class_id}, school_year_id: ${a.school_year_id}`);
  });

  console.log('\nOK Affectations mises a jour avec succes');
}

fixAssignmentsSchoolYearId();
