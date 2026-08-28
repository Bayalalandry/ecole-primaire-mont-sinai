const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testExpensesModule() {
  console.log('=== TEST MODULE GESTION DES DÉPENSES ===\n');

  const founderId = '64c50d04-d3a3-4044-a9d5-57a7f43fff10'; // Inno

  // ÉTAPE 1: Ajouter une dépense avec justificatif
  console.log('--- ETAPE 1: Ajout d\'une dépense ---');
  const expense1 = {
    category: 'fournitures',
    amount: 50000,
    expense_date: '2026-08-20',
    description: 'Achat de cahiers et stylos pour la rentrée',
    receipt_url: 'https://example.com/receipt1.pdf',
    created_by: founderId,
  };

  const { data: newExpense, error: addError } = await supabase
    .from('expenses')
    .insert(expense1)
    .select()
    .single();

  if (addError) {
    console.error('Erreur ajout dépense:', addError);
  } else {
    console.log('✅ Dépense ajoutée avec succès');
    console.log(`   ID: ${newExpense.id}`);
    console.log(`   Catégorie: ${newExpense.category}`);
    console.log(`   Montant: ${newExpense.amount} FCFA`);
    console.log(`   Justificatif: ${newExpense.receipt_url}`);
  }

  // ÉTAPE 2: Ajouter d'autres dépenses pour les tests
  console.log('\n--- ETAPE 2: Ajout de dépenses supplémentaires ---');
  const additionalExpenses = [
    {
      category: 'electricite_eau',
      amount: 75000,
      expense_date: '2026-08-15',
      description: 'Facture electricite aout',
      receipt_url: null,
      created_by: founderId,
    },
    {
      category: 'entretien',
      amount: 120000,
      expense_date: '2026-08-10',
      description: 'Reparation toiture',
      receipt_url: 'https://example.com/receipt2.pdf',
      created_by: founderId,
    },
    {
      category: 'cantine',
      amount: 200000,
      expense_date: '2026-08-05',
      description: 'Approvisionnement cantine',
      receipt_url: null,
      created_by: founderId,
    },
    {
      category: 'transport',
      amount: 45000,
      expense_date: '2026-07-25',
      description: 'Carburant vehicule scolaire',
      receipt_url: 'https://example.com/receipt3.pdf',
      created_by: founderId,
    },
  ];

  for (const expense of additionalExpenses) {
    const { error } = await supabase.from('expenses').insert(expense);
    if (error) {
      console.error(`Erreur pour ${expense.category}:`, error);
    } else {
      console.log(`✅ ${expense.category}: ${expense.amount} FCFA`);
    }
  }

  // ÉTAPE 3: Vérifier que les dépenses apparaissent dans l'historique
  console.log('\n--- ETAPE 3: Vérification historique ---');
  const { data: allExpenses, error: fetchError } = await supabase
    .from('expenses')
    .select('*, users(username)')
    .order('expense_date', { ascending: false });

  if (fetchError) {
    console.error('Erreur récupération dépenses:', fetchError);
  } else {
    console.log(`✅ Total dépenses: ${allExpenses.length}`);
    allExpenses.forEach(e => {
      console.log(`- ${e.expense_date} | ${e.category} | ${e.amount} FCFA | ${e.description || 'Sans description'}`);
    });
  }

  // ÉTAPE 4: Tester les filtres par catégorie
  console.log('\n--- ETAPE 4: Test filtre par catégorie ---');
  const { data: fournituresExpenses } = await supabase
    .from('expenses')
    .select('*')
    .eq('category', 'fournitures');

  console.log('✅ Depenses "Fournitures scolaires": ' + fournituresExpenses.length);
  const totalFournitures = fournituresExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  console.log('   Total: ' + totalFournitures + ' FCFA');

  // ÉTAPE 5: Tester les filtres par période
  console.log('\n--- ETAPE 5: Test filtre par période ---');
  const { data: augustExpenses } = await supabase
    .from('expenses')
    .select('*')
    .gte('expense_date', '2026-08-01')
    .lte('expense_date', '2026-08-31');

  console.log(`✅ Dépenses août 2026: ${augustExpenses.length}`);
  const totalAugust = augustExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  console.log(`   Total: ${totalAugust} FCFA`);

  // ÉTAPE 6: Tester les statistiques (totaux)
  console.log('\n--- ETAPE 6: Test statistiques ---');
  const { data: allExpensesForStats } = await supabase
    .from('expenses')
    .select('category, amount');

  const totalsByCategory = {};
  let totalAmount = 0;

  allExpensesForStats.forEach((expense) => {
    if (!totalsByCategory[expense.category]) {
      totalsByCategory[expense.category] = 0;
    }
    totalsByCategory[expense.category] += Number(expense.amount);
    totalAmount += Number(expense.amount);
  });

  console.log('✅ Total general: ' + totalAmount + ' FCFA');
  console.log('   Par categorie:');
  Object.entries(totalsByCategory).forEach(([category, amount]) => {
    console.log('   - ' + category + ': ' + amount + ' FCFA');
  });

  // ÉTAPE 7: Tester la modification
  console.log('\n--- ETAPE 7: Test modification ---');
  if (newExpense) {
    const { error: updateError } = await supabase
      .from('expenses')
      .update({
        amount: 55000,
        description: 'Achat de cahiers et stylos (modifie)',
      })
      .eq('id', newExpense.id);

    if (updateError) {
      console.error('Erreur modification:', updateError);
    } else {
      console.log('✅ Depense modifiee avec succes');
    }
  }

  // ÉTAPE 8: Tester la suppression
  console.log('\n--- ETAPE 8: Test suppression ---');
  const { data: expenseToDelete } = await supabase
    .from('expenses')
    .select('*')
    .eq('category', 'autres')
    .maybeSingle();

  if (expenseToDelete) {
    const { error: deleteError } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseToDelete.id);

    if (deleteError) {
      console.error('Erreur suppression:', deleteError);
    } else {
      console.log('✅ Depense supprimee avec succes');
    }
  } else {
    console.log('ℹ️ Aucune depense "autres" a supprimer');
  }

  console.log('\n=== TEST MODULE DEPENSES TERMINE ===');
}

testExpensesModule();
