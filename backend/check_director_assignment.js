const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkDirectorAssignment() {
  try {
    console.log('Vérification de l\'assignation du directeur...');

    // Récupérer le compte directeur
    const { data: director, error: directorError } = await supabase
      .from('users')
      .select('*')
      .eq('username', 'Directeur')
      .single();

    if (directorError || !director) {
      console.error('Erreur lors de la récupération du directeur:', directorError);
      return;
    }

    console.log('Directeur ID:', director.id);

    // Récupérer l'année scolaire actuelle
    const { data: schoolYear, error: yearError } = await supabase
      .from('school_years')
      .select('*')
      .eq('is_current', true)
      .single();

    if (yearError || !schoolYear) {
      console.error('Erreur lors de la récupération de l\'année scolaire:', yearError);
      return;
    }

    console.log('Année scolaire ID:', schoolYear.id);

    // Récupérer la classe CP1
    const { data: cp1Class, error: classError } = await supabase
      .from('classes')
      .select('*')
      .eq('name', 'CP1')
      .single();

    if (classError || !cp1Class) {
      console.error('Erreur lors de la récupération de la classe CP1:', classError);
      return;
    }

    console.log('Classe CP1 ID:', cp1Class.id);

    // Vérifier l'assignation
    const { data: assignment, error: assignmentError } = await supabase
      .from('teacher_class_assignments')
      .select('*')
      .eq('teacher_id', director.id)
      .eq('class_id', cp1Class.id)
      .eq('school_year_id', schoolYear.id)
      .maybeSingle();

    if (assignmentError) {
      console.error('Erreur lors de la vérification de l\'assignation:', assignmentError);
      return;
    }

    if (assignment) {
      console.log('✅ Assignation trouvée:');
      console.log('Teacher ID:', assignment.teacher_id);
      console.log('Class ID:', assignment.class_id);
      console.log('School Year ID:', assignment.school_year_id);
    } else {
      console.log('❌ Aucune assignation trouvée');
      console.log('Paramètres de recherche:');
      console.log('  teacher_id:', director.id);
      console.log('  class_id:', cp1Class.id);
      console.log('  school_year_id:', schoolYear.id);
    }

    // Vérifier toutes les assignations pour ce teacher_id
    const { data: allAssignments, error: allError } = await supabase
      .from('teacher_class_assignments')
      .select('*')
      .eq('teacher_id', director.id);

    if (allError) {
      console.error('Erreur lors de la récupération de toutes les assignations:', allError);
    } else {
      console.log('\nToutes les assignations pour ce teacher_id:', allAssignments);
    }

  } catch (error) {
    console.error('Erreur inattendue:', error);
  }
}

checkDirectorAssignment();