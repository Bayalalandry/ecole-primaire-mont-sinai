const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testDeleteExpense() {
  console.log('=== TEST SUPPRESSION DÉPENSE ===\n');

  // ÉTAPE 1: Récupérer une dépense existante
  console.log('--- ETAPE 1: Selection d\'une depense a supprimer ---');
  const { data: expenses } = await supabase
    .from('expenses')
    .select('*')
    .limit(1);

  if (!expenses || expenses.length === 0) {
    console.log('ERREUR: Aucune depense trouvee');
    return;
  }

  const expenseToDelete = expenses[0];
  console.log('Depense selectionnee:');
  console.log(`- ID: ${expenseToDelete.id}`);
  console.log(`- Categorie: ${expenseToDelete.category}`);
  console.log(`- Montant: ${expenseToDelete.amount} FCFA`);
  console.log(`- Date: ${expenseToDelete.expense_date}`);
  console.log(`- Description: ${expenseToDelete.description}`);

  // ÉTAPE 2: Récupérer les totaux avant suppression
  console.log('\n--- ETAPE 2: Totaux avant suppression ---');
  const { data: expensesBefore } = await supabase
    .from('expenses')
    .select('category, amount');

  const totalsBefore = {};
  let totalBefore = 0;

  expensesBefore.forEach((e) => {
    if (!totalsBefore[e.category]) {
      totalsBefore[e.category] = 0;
    }
    totalsBefore[e.category] += Number(e.amount);
    totalBefore += Number(e.amount);
  });

  console.log('Total general avant: ' + totalBefore + ' FCFA');
  console.log('Totaux par categorie avant:');
  Object.entries(totalsBefore).forEach(([cat, amount]) => {
    console.log(`- ${cat}: ${amount} FCFA`);
  });

  // ÉTAPE 3: Simuler la confirmation (l'interface frontend demande confirmation)
  console.log('\n--- ETAPE 3: Simulation confirmation ---');
  console.log('ℹ️ NOTE: Le frontend a une confirmation avant suppression');
  console.log('   Code frontend: if (!confirm("Êtes-vous sûr de vouloir supprimer cette dépense ?")) return;');
  console.log('   Confirme: OUI (simulation)');

  // ÉTAPE 4: Supprimer la dépense
  console.log('\n--- ETAPE 4: Suppression de la depense ---');
  const { error: deleteError } = await supabase
    .from('expenses')
    .delete()
    .eq('id', expenseToDelete.id);

  if (deleteError) {
    console.error('❌ Erreur suppression:', deleteError);
    return;
  }

  console.log('✅ Depense supprimee avec succes');

  // ÉTAPE 5: Vérifier que la dépense a disparu de l'historique
  console.log('\n--- ETAPE 5: Verification disparition historique ---');
  const { data: expenseAfter } = await supabase
    .from('expenses')
    .select('*')
    .eq('id', expenseToDelete.id)
    .maybeSingle();

  if (expenseAfter) {
    console.log('❌ ERREUR: La depense existe encore dans l\'historique');
  } else {
    console.log('✅ La depense a bien disparu de l\'historique');
  }

  // ÉTAPE 6: Vérifier que les totaux se sont recalculés
  console.log('\n--- ETAPE 6: Verification recalcul des totaux ---');
  const { data: expensesAfter } = await supabase
    .from('expenses')
    .select('category, amount');

  const totalsAfter = {};
  let totalAfter = 0;

  expensesAfter.forEach((e) => {
    if (!totalsAfter[e.category]) {
      totalsAfter[e.category] = 0;
    }
    totalsAfter[e.category] += Number(e.amount);
    totalAfter += Number(e.amount);
  });

  console.log('Total general apres: ' + totalAfter + ' FCFA');
  console.log('Totaux par categorie apres:');
  Object.entries(totalsAfter).forEach(([cat, amount]) => {
    console.log(`- ${cat}: ${amount} FCFA`);
  });

  // ÉTAPE 7: Vérifier que la différence correspond au montant supprimé
  console.log('\n--- ETAPE 7: Verification de la difference ---');
  const difference = totalBefore - totalAfter;
  console.log('Difference calculee: ' + difference + ' FCFA');
  console.log('Montant supprime: ' + Number(expenseToDelete.amount) + ' FCFA');

  if (difference === Number(expenseToDelete.amount)) {
    console.log('✅ Les totaux se sont correctement recalcules');
  } else {
    console.log('❌ ERREUR: Les totaux ne sont pas corrects');
  }

  // Vérifier par catégorie
  const categoryDiff = totalsBefore[expenseToDelete.category] - (totalsAfter[expenseToDelete.category] || 0);
  console.log(`Difference categorie ${expenseToDelete.category}: ${categoryDiff} FCFA`);

  if (categoryDiff === Number(expenseToDelete.amount)) {
    console.log('✅ Le total de la categorie s\'est correctement recalcule');
  } else {
    console.log('❌ ERREUR: Le total de la categorie n\'est pas correct');
  }

  console.log('\n=== TEST SUPPRESSION TERMINE ===');
}

testDeleteExpense();
