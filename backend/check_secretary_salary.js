const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkSecretarySalary() {
  console.log('=== Vérification du salaire du secrétaire ===\n');

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', 'Bayalalandry')
      .maybeSingle();

    if (error) {
      console.log('Erreur:', error.message);
      return;
    }

    if (!user) {
      console.log('Utilisateur Bayalalandry non trouvé');
      return;
    }

    console.log('Utilisateur trouvé:', user.first_name, user.last_name);
    console.log('ID:', user.id);

    // Check secretary_salaries
    const { data: salaries, error: salariesError } = await supabase
      .from('secretary_salaries')
      .select('*')
      .eq('secretary_id', user.id);

    if (salariesError) {
      console.log('Erreur lors de la récupération des salaires:', salariesError.message);
    } else {
      console.log('\nSalaires trouvés:', salaries ? salaries.length : 0);
      if (salaries && salaries.length > 0) {
        salaries.forEach(s => {
          console.log(`  - ID: ${s.id}, Montant: ${s.monthly_amount}, Date: ${s.effective_date}`);
        });
      } else {
        console.log('  Aucun salaire trouvé');
      }
    }

    // Check salary_payments
    const { data: payments, error: paymentsError } = await supabase
      .from('salary_payments')
      .select('*')
      .eq('secretary_id', user.id);

    if (paymentsError) {
      console.log('Erreur lors de la récupération des paiements:', paymentsError.message);
    } else {
      console.log('\nPaiements trouvés:', payments ? payments.length : 0);
      if (payments && payments.length > 0) {
        payments.forEach(p => {
          console.log(`  - ID: ${p.id}, Montant: ${p.amount}, Date: ${p.payment_date}`);
        });
      } else {
        console.log('  Aucun paiement trouvé');
      }
    }

  } catch (error) {
    console.log('Erreur:', error.message);
  }
}

checkSecretarySalary().then(() => process.exit(0));
