const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkTablesStructure() {
  try {
    console.log('=== Verification de la structure des tables ===\n');

    // 1. Structure de tuition_payments
    console.log('1. Structure de tuition_payments:');
    const { data: tuitionData, error: tuitionError } = await supabase
      .from('tuition_payments')
      .select('*')
      .limit(1);

    if (tuitionError) {
      console.error('Erreur:', tuitionError);
    } else if (tuitionData && tuitionData.length > 0) {
      console.log('Colonnes disponibles:', Object.keys(tuitionData[0]));
    } else {
      console.log('Table vide ou inaccessible');
    }

    // 2. Structure de salary_payments
    console.log('\n2. Structure de salary_payments:');
    const { data: salaryData, error: salaryError } = await supabase
      .from('salary_payments')
      .select('*')
      .limit(1);

    if (salaryError) {
      console.error('Erreur:', salaryError);
    } else if (salaryData && salaryData.length > 0) {
      console.log('Colonnes disponibles:', Object.keys(salaryData[0]));
    } else {
      console.log('Table vide ou inaccessible');
    }

    // 3. Structure de expenses
    console.log('\n3. Structure de expenses:');
    const { data: expenseData, error: expenseError } = await supabase
      .from('expenses')
      .select('*')
      .limit(1);

    if (expenseError) {
      console.error('Erreur:', expenseError);
    } else if (expenseData && expenseData.length > 0) {
      console.log('Colonnes disponibles:', Object.keys(expenseData[0]));
    } else {
      console.log('Table vide ou inaccessible');
    }

  } catch (error) {
    console.error('Erreur lors de la verification:', error);
  }
}

checkTablesStructure();