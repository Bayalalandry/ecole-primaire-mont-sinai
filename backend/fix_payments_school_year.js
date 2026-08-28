const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function fixPaymentsSchoolYear() {
  console.log('=== CORRECTION SCHOOL_YEAR_ID DES PAIEMENTS ===\n');

  // Récupérer l'année scolaire actuelle
  const { data: currentSchoolYear } = await supabase
    .from('school_years')
    .select('id')
    .eq('is_current', true)
    .single();

  console.log('Annee scolaire actuelle: ' + currentSchoolYear.year_label + ' (id: ' + currentSchoolYear.id + ')');

  // Mettre à jour les paiements de scolarité avec school_year_id = null
  const { data: tuitionPayments } = await supabase
    .from('tuition_payments')
    .select('id')
    .is('school_year_id', null);

  console.log('\nPaiements de scolarite sans school_year_id: ' + (tuitionPayments?.length || 0));

  if (tuitionPayments && tuitionPayments.length > 0) {
    const { error: tuitionError } = await supabase
      .from('tuition_payments')
      .update({ school_year_id: currentSchoolYear.id })
      .is('school_year_id', null);

    if (tuitionError) {
      console.error('Erreur mise a jour paiements scolarite:', tuitionError);
    } else {
      console.log('✅ Paiements de scolarite mis a jour');
    }
  }

  // Mettre à jour les paiements de salaire avec school_year_id = null
  const { data: salaryPayments } = await supabase
    .from('salary_payments')
    .select('id')
    .is('school_year_id', null);

  console.log('\nPaiements de salaire sans school_year_id: ' + (salaryPayments?.length || 0));

  if (salaryPayments && salaryPayments.length > 0) {
    const { error: salaryError } = await supabase
      .from('salary_payments')
      .update({ school_year_id: currentSchoolYear.id })
      .is('school_year_id', null);

    if (salaryError) {
      console.error('Erreur mise a jour paiements salaire:', salaryError);
    } else {
      console.log('✅ Paiements de salaire mis a jour');
    }
  }

  console.log('\n=== CORRECTION TERMINEE ===');
}

fixPaymentsSchoolYear();
