const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkSalaryData() {
  console.log('=== Vérification des données salaires ===\n');

  // Vérifier teacher_salaries
  console.log('1. Données dans teacher_salaries:');
  const { data: salaries, error: salariesError } = await supabase
    .from('teacher_salaries')
    .select('*');

  if (salariesError) {
    console.error('Erreur teacher_salaries:', salariesError);
  } else {
    console.log(`Nombre d'enregistrements: ${salaries?.length || 0}`);
    if (salaries && salaries.length > 0) {
      console.log('Premier enregistrement:', JSON.stringify(salaries[0], null, 2));
    }
  }

  // Vérifier salary_payments
  console.log('\n2. Données dans salary_payments:');
  const { data: payments, error: paymentsError } = await supabase
    .from('salary_payments')
    .select('*');

  if (paymentsError) {
    console.error('Erreur salary_payments:', paymentsError);
  } else {
    console.log(`Nombre d'enregistrements: ${payments?.length || 0}`);
    if (payments && payments.length > 0) {
      console.log('Premier enregistrement:', JSON.stringify(payments[0], null, 2));
    }
  }

  // Vérifier school_years
  console.log('\n3. Données dans school_years:');
  const { data: schoolYears, error: syError } = await supabase
    .from('school_years')
    .select('*');

  if (syError) {
    console.error('Erreur school_years:', syError);
  } else {
    console.log(`Nombre d'enregistrements: ${schoolYears?.length || 0}`);
    if (schoolYears && schoolYears.length > 0) {
      console.log('Années scolaires:', schoolYears.map(sy => ({ id: sy.id, year_label: sy.year_label, is_current: sy.is_current })));
    }
  }
}

checkSalaryData().catch(console.error);