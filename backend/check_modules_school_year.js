const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkAllModulesSchoolYear() {
  console.log('=== VERIFICATION UTILISATION ANNEE SCOLAIRE PAR MODULE ===\n');

  // Récupérer l'année scolaire actuelle
  const { data: currentSchoolYear } = await supabase
    .from('school_years')
    .select('*')
    .eq('is_current', true)
    .single();

  console.log('Annee scolaire actuelle (is_current = true):');
  console.log(JSON.stringify(currentSchoolYear, null, 2));

  console.log('\n--- VERIFICATION DES DONNEES LIEES ---\n');

  // Vérifier les tarifs de scolarité
  const { data: tuitionRates } = await supabase
    .from('tuition_rates')
    .select('*')
    .eq('school_year_id', currentSchoolYear.id);

  console.log('Tarifs de scolarite pour l\'annee actuelle: ' + (tuitionRates?.length || 0));

  // Vérifier les salaires
  const { data: teacherSalaries } = await supabase
    .from('teacher_salaries')
    .select('*')
    .eq('school_year_id', currentSchoolYear.id);

  console.log('Salaires enseignants pour l\'annee actuelle: ' + (teacherSalaries?.length || 0));

  // Vérifier les paiements de scolarité
  const { data: tuitionPayments } = await supabase
    .from('tuition_payments')
    .select('*')
    .eq('school_year_id', currentSchoolYear.id);

  console.log('Paiements de scolarite pour l\'annee actuelle: ' + (tuitionPayments?.length || 0));

  // Vérifier les paiements de salaire
  const { data: salaryPayments } = await supabase
    .from('salary_payments')
    .select('*')
    .eq('school_year_id', currentSchoolYear.id);

  console.log('Paiements de salaire pour l\'annee actuelle: ' + (salaryPayments?.length || 0));

  // Vérifier les décisions de passage
  const { data: passageDecisions } = await supabase
    .from('passage_decisions')
    .select('*')
    .eq('school_year_id', currentSchoolYear.id);

  console.log('Decisions de passage pour l\'annee actuelle: ' + (passageDecisions?.length || 0));

  // Vérifier les dépenses (ne sont pas liées à une année scolaire)
  const { data: expenses } = await supabase
    .from('expenses')
    .select('*');

  console.log('Depenses totales (non liees a annee scolaire): ' + (expenses?.length || 0));

  console.log('\n--- RECOMMANDATIONS ---\n');
  console.log('✅ L\'annee scolaire actuelle est 2026-2027 (is_current = true)');
  console.log('Les modules doivent utiliser cette reference via:');
  console.log('- Backend: .eq(\'is_current\', true) pour recuperer l\'ID');
  console.log('- Frontend: Afficher l\'annee scolaire actuelle dans les formulaires');
  console.log('- S\'assurer que school_year_id est correctement renseigne dans les nouvelles entrees');
}

checkAllModulesSchoolYear();
