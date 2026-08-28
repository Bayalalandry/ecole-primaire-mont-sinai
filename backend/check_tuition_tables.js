const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkTuitionTables() {
  console.log('=== VERIFICATION TABLES SCOLARITES ===\n');

  // Vérifier tuition_payments
  const { data: tuitionPayments, error: paymentsError } = await supabase
    .from('tuition_payments')
    .select('*')
    .limit(3);

  if (paymentsError) {
    console.error('Erreur tuition_payments:', paymentsError);
  } else {
    console.log('Table tuition_payments:');
    console.log(JSON.stringify(tuitionPayments, null, 2));
  }

  // Vérifier tuition_records
  try {
    const { data: tuitionRecords } = await supabase
      .from('tuition_records')
      .select('*')
      .limit(3);

    console.log('\nTable tuition_records:');
    console.log(JSON.stringify(tuitionRecords, null, 2));
  } catch (e) {
    console.log('\nTable tuition_records n\'existe pas');
  }

  // Vérifier tuition_rates
  try {
    const { data: tuitionRates } = await supabase
      .from('tuition_rates')
      .select('*')
      .limit(3);

    console.log('\nTable tuition_rates:');
    console.log(JSON.stringify(tuitionRates, null, 2));
  } catch (e) {
    console.log('\nTable tuition_rates n\'existe pas');
  }

  // Vérifier les élèves avec leurs tarifs
  const { data: students } = await supabase
    .from('students')
    .select('*')
    .limit(3);

  console.log('\nEleves:');
  students?.forEach(s => {
    console.log('- ' + s.first_name + ' ' + s.last_name);
    if (s.tuition_rate_id) {
      console.log('  tuition_rate_id: ' + s.tuition_rate_id);
    }
  });
}

checkTuitionTables();
