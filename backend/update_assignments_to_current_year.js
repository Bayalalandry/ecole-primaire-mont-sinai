const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function updateAssignmentsToCurrentYear() {
  console.log('=== MISE A JOUR DES AFFECTATIONS POUR 2026-2027 ===\n');

  const schoolYearLabel = '2026-2027';

  // Recuperer ou creer l'annee scolaire
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
        start_date: '2026-09-01',
        end_date: '2027-07-31',
      })
      .select()
      .single();
    schoolYearId = newSchoolYear.id;
  } else {
    schoolYearId = existingSchoolYear.id;
  }

  console.log(`Annee scolaire ID: ${schoolYearId}`);

  // Mettre a jour toutes les affectations vers 2026-2027
  const { data: assignments } = await supabase
    .from('teacher_class_assignments')
    .select('*');

  console.log(`Total affectations a mettre a jour: ${assignments.length}`);

  for (const assignment of assignments) {
    const { error } = await supabase
      .from('teacher_class_assignments')
      .update({ school_year_id: schoolYearId })
      .eq('id', assignment.id);

    if (error) {
      console.error(`Erreur pour l'affectation ${assignment.id}:`, error);
    } else {
      console.log(`OK Affectation ${assignment.id} -> ${schoolYearLabel}`);
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

updateAssignmentsToCurrentYear();
