const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testStatisticsAPI() {
  console.log('=== TEST API STATISTIQUES ===\n');

  // Simuler une requête avec token (en pratique, on utiliserait un vrai token JWT)
  // Pour ce test, on va appeler l'endpoint et vérifier la réponse

  const founderId = '64c50d04-d3a3-4044-a9d5-57a7f43fff10';

  // Récupérer un token valide en se connectant
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email: 'inno@ecole.com',
    password: 'Inno123!',
  });

  if (loginError) {
    console.error('Erreur de connexion:', loginError);
    return;
  }

  const token = loginData.session.access_token;
  console.log('✅ Connexion reussie');

  // Appeler l'API des statistiques
  const response = await fetch('http://localhost:5000/api/statistics', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    console.error('Erreur API:', response.status, response.statusText);
    const errorText = await response.text();
    console.error('Details:', errorText);
    return;
  }

  const apiData = await response.json();
  console.log('✅ API appelee avec succes');
  console.log('\nDonnees retournees par l\'API:');
  console.log(JSON.stringify(apiData, null, 2));

  // Vérifier que les données correspondent
  console.log('\n--- VERIFICATION API vs BASE DE DONNEES ---');

  // Récupérer les données de base pour comparaison
  const { data: tuitionPayments } = await supabase
    .from('tuition_payments')
    .select('amount');

  const totalTuitionCollected = tuitionPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

  const { data: expenses } = await supabase
    .from('expenses')
    .select('category, amount');

  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

  console.log('Verification scolarites:');
  console.log('  API: ' + apiData.tuition.totalCollected);
  console.log('  Base: ' + totalTuitionCollected);
  console.log('  OK: ' + (apiData.tuition.totalCollected === totalTuitionCollected ? 'OUI' : 'NON'));

  console.log('\nVerification depenses:');
  console.log('  API: ' + apiData.expenses.total);
  console.log('  Base: ' + totalExpenses);
  console.log('  OK: ' + (apiData.expenses.total === totalExpenses ? 'OUI' : 'NON'));

  console.log('\nVerification bilan:');
  const expectedBalance = apiData.financial.totalRevenue - apiData.financial.totalExpenses;
  console.log('  API: ' + apiData.financial.balance);
  console.log('  Calcule: ' + expectedBalance);
  console.log('  OK: ' + (apiData.financial.balance === expectedBalance ? 'OUI' : 'NON'));

  console.log('\n=== TEST API STATISTIQUES TERMINE ===');
}

testStatisticsAPI();
