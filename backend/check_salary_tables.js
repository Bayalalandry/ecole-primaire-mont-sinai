const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkSalaryTables() {
  console.log('=== VERIFICATION TABLES SALAIRES ===\n');

  // Vérifier salary_payments
  const { data: salaryPayments, error: paymentsError } = await supabase
    .from('salary_payments')
    .select('*')
    .limit(3);

  if (paymentsError) {
    console.error('Erreur salary_payments:', paymentsError);
  } else {
    console.log('Table salary_payments:');
    console.log(JSON.stringify(salaryPayments, null, 2));
  }

  // Vérifier s'il y a une table teacher_salaries ou similaire
  try {
    const { data: teacherSalaries } = await supabase
      .from('teacher_salaries')
      .select('*')
      .limit(3);

    console.log('\nTable teacher_salaries:');
    console.log(JSON.stringify(teacherSalaries, null, 2));
  } catch (e) {
    console.log('\nTable teacher_salaries n\'existe pas');
  }

  // Vérifier les enseignants pour voir leurs salaires
  const { data: teachers } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'teacher');

  console.log('\nEnseignants:');
  teachers?.forEach(t => {
    console.log('- ' + t.username + ' | ' + t.first_name + ' ' + t.last_name);
    if (t.monthly_salary) {
      console.log('  Salaire: ' + t.monthly_salary + ' FCFA');
    }
  });
}

checkSalaryTables();
