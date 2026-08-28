const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function debugTuitionCalculation() {
  console.log('=== DEBUG CALCUL SCOLARITES ===\n');

  // Récupérer l'année scolaire actuelle
  const { data: currentSchoolYear } = await supabase
    .from('school_years')
    .select('*')
    .eq('is_current', true)
    .maybeSingle();

  console.log('Annee scolaire actuelle:');
  console.log(JSON.stringify(currentSchoolYear, null, 2));

  // Récupérer les élèves actifs
  const { data: activeStudents } = await supabase
    .from('students')
    .select('id, current_class_id')
    .eq('status', 'active');

  console.log('\nEleves actifs: ' + (activeStudents?.length || 0));

  const classIds = [...new Set(activeStudents?.map(s => s.current_class_id) || [])];
  console.log('Classes des eleves actifs:');
  console.log(classIds);

  const schoolYearId = currentSchoolYear?.id;

  // Récupérer les tarifs pour ces classes
  if (classIds.length > 0 && schoolYearId) {
    const { data: tuitionRates } = await supabase
      .from('tuition_rates')
      .select('*')
      .eq('school_year_id', schoolYearId)
      .in('class_id', classIds);

    console.log('\nTarifs recuperes (filtre school_year_id: ' + schoolYearId + '):');
    console.log(JSON.stringify(tuitionRates, null, 2));

    // Si aucun tarif, essayer sans filtre d'année scolaire
    if (!tuitionRates || tuitionRates.length === 0) {
      const { data: allTuitionRates } = await supabase
        .from('tuition_rates')
        .select('*')
        .in('class_id', classIds);

      console.log('\nTous les tarifs (sans filtre annee):');
      console.log(JSON.stringify(allTuitionRates, null, 2));

    console.log('\nTarifs recuperes:');
    console.log(JSON.stringify(tuitionRates, null, 2));

      const rateMap = {};
      allTuitionRates?.forEach((rate) => {
        rateMap[rate.class_id] = Number(rate.amount);
      });

      console.log('\nMap des tarifs:');
      console.log(JSON.stringify(rateMap, null, 2));

      const totalExpected = activeStudents?.reduce((sum, student) => {
        return sum + (rateMap[student.current_class_id] || 0);
      }, 0) || 0;

      console.log('\nTotal attendu calcule: ' + totalExpected + ' FCFA');
    } else {
      const rateMap = {};
      tuitionRates?.forEach((rate) => {
        rateMap[rate.class_id] = Number(rate.amount);
      });

      console.log('\nMap des tarifs:');
      console.log(JSON.stringify(rateMap, null, 2));

      const totalExpected = activeStudents?.reduce((sum, student) => {
        return sum + (rateMap[student.current_class_id] || 0);
      }, 0) || 0;

      console.log('\nTotal attendu calcule: ' + totalExpected + ' FCFA');
    }
  } else {
    console.log('\nPas de classes ou pas d\'annee scolaire');
  }
}

debugTuitionCalculation();
