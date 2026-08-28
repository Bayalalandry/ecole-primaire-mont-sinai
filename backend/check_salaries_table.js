const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkSalariesTable() {
  console.log('=== VERIFICATION TABLE SALARIES ===\n');

  // Vérifier la structure de la table salaries
  const { data: salaries, error } = await supabase
    .from('salaries')
    .select('*')
    .limit(5);

  if (error) {
    console.error('Erreur:', error);
  } else {
    console.log('Structure de la table salaries:');
    console.log(JSON.stringify(salaries, null, 2));
  }

  // Compter le total des salaires
  const { data: allSalaries } = await supabase
    .from('salaries')
    .select('monthly_amount');

  const totalMonthly = allSalaries?.reduce((sum, s) => sum + Number(s.monthly_amount), 0) || 0;
  console.log('\nTotal mensuel des salaires: ' + totalMonthly + ' FCFA');

  // Vérifier l'année scolaire actuelle
  const { data: currentSchoolYear } = await supabase
    .from('school_years')
    .select('*')
    .eq('is_current', true)
    .single();

  console.log('\nAnnee scolaire actuelle:');
  console.log(JSON.stringify(currentSchoolYear, null, 2));

  // Vérifier les salaires pour l'année scolaire actuelle
  if (currentSchoolYear) {
    const { data: currentSalaries } = await supabase
      .from('salaries')
      .select('*')
      .eq('school_year_id', currentSchoolYear.id);

    console.log('\nSalaires pour l\'annee scolaire actuelle:');
    console.log('Nombre: ' + (currentSalaries?.length || 0));
    currentSalaries?.forEach(s => {
      console.log('- ' + s.monthly_amount + ' FCFA/mois');
    });

    const totalCurrentMonthly = currentSalaries?.reduce((sum, s) => sum + Number(s.monthly_amount), 0) || 0;
    console.log('Total mensuel: ' + totalCurrentMonthly + ' FCFA');
  }
}

checkSalariesTable();
